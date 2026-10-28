const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'www');
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/manifest+json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

http.createServer((request, response) => {
  const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  const resolved = path.resolve(root, `.${requested}`);
  const relativePath = path.relative(root, resolved);
  const isInsideRoot = relativePath === '' || (!relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath));
  const filePath = isInsideRoot ? resolved : path.join(root, 'index.html');

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT' && !path.extname(requested)) {
        return fs.readFile(path.join(root, 'index.html'), (fallbackError, fallback) => {
          if (fallbackError) return response.writeHead(500).end('Unable to load APEX Workout.');
          response.writeHead(200, { 'Content-Type': mimeTypes['.html'], 'Cache-Control': 'no-store' });
          response.end(fallback);
        });
      }
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end(error.code === 'ENOENT' ? 'Not found.' : 'Server error.');
      return;
    }
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-store' : 'public, max-age=86400',
    });
    response.end(content);
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`APEX Workout local preview is running on port ${port}.`);
});
