import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

import 'theme/widgetbook_theme.dart';
import 'main.directories.g.dart';

void main() => runApp(const VisorWidgetbookApp());

@widgetbook.App()
class VisorWidgetbookApp extends StatelessWidget {
  const VisorWidgetbookApp({super.key});

  @override
  Widget build(BuildContext context) => Widgetbook.material(
        directories: directories,
        addons: [
          ThemeAddon<ThemeData>(
            themes: [
              WidgetbookTheme(name: 'Light', data: VisorDemoTheme.light),
              WidgetbookTheme(name: 'Dark', data: VisorDemoTheme.dark),
            ],
            themeBuilder: (context, theme, child) =>
                Theme(data: theme, child: child),
          ),
        ],
      );
}
