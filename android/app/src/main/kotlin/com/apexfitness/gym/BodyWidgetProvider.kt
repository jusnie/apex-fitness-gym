package com.apexfitness.gym

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetProvider

class BodyWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences
    ) {
        appWidgetIds.forEach { widgetId ->
            val views = RemoteViews(context.packageName, R.layout.widget_body).apply {
                bindThemedImage(context, widgetData, "body_img", R.drawable.preview_body)
            }
            try {
                appWidgetManager.updateAppWidget(widgetId, views)
            } catch (_: Exception) {
                // A launcher must not be able to crash the main app if it is
                // restoring an old oversized widget bitmap. The next safe
                // refresh replaces it with the compact image above.
            }
        }
    }
}
