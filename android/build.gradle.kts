import com.android.build.api.dsl.LibraryExtension

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// This distribution is intentionally packaged as ARM64-only. Limit the JNI
// dependency's CMake matrix as well, so Gradle does not compile unused 32-bit
// and emulator native binaries during an ARM64 release build.
subprojects {
    plugins.withId("com.android.library") {
        if (name == "jni") {
            extensions.configure<LibraryExtension> {
                defaultConfig {
                    ndk {
                        abiFilters.add("arm64-v8a")
                    }
                }
            }
        }
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
