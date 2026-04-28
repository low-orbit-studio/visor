import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_error_view/visor_error_view.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

void _noop() {}

@widgetbook.UseCase(name: 'Default', type: VisorErrorView)
Widget defaultUseCase(BuildContext context) => VisorErrorView(
      message: context.knobs
          .string(label: 'Message', initialValue: 'Something went wrong.'),
    );

@widgetbook.UseCase(name: 'With Body Copy', type: VisorErrorView)
Widget withBodyUseCase(BuildContext context) => VisorErrorView(
      message: context.knobs.string(
        label: 'Message',
        initialValue: 'Could not load your timeline.',
      ),
      body: context.knobs.stringOrNull(
        label: 'Body',
        initialValue: 'Check your connection and try again.',
      ),
    );

@widgetbook.UseCase(name: 'With Retry', type: VisorErrorView)
Widget withRetryUseCase(BuildContext context) => VisorErrorView(
      message: context.knobs.string(
        label: 'Message',
        initialValue: 'Failed to fetch data.',
      ),
      body: context.knobs.stringOrNull(
        label: 'Body',
        initialValue: 'Pull down to refresh or tap below.',
      ),
      retryCallback: _noop,
      retryLabel: context.knobs.string(
        label: 'Retry label',
        initialValue: 'Try again',
      ),
    );

@widgetbook.UseCase(name: 'Network Error', type: VisorErrorView)
Widget networkErrorUseCase(BuildContext context) => VisorErrorView(
      icon: Icons.wifi_off,
      message: context.knobs.string(
        label: 'Message',
        initialValue: 'No internet connection.',
      ),
      body: context.knobs.stringOrNull(
        label: 'Body',
        initialValue: 'Please check your Wi-Fi or mobile data and try again.',
      ),
      retryCallback: _noop,
      retryLabel: 'Reconnect',
    );

@widgetbook.UseCase(name: 'With Scaffold', type: VisorErrorView)
Widget withScaffoldUseCase(BuildContext context) => VisorErrorView(
      message: context.knobs.string(
        label: 'Message',
        initialValue: 'Page not found.',
      ),
      body: context.knobs.stringOrNull(
        label: 'Body',
        initialValue: 'This page no longer exists or has been moved.',
      ),
      retryCallback: _noop,
      wrapWithScaffold: true,
      scaffoldTitle: context.knobs.stringOrNull(
        label: 'Scaffold title',
        initialValue: 'Error',
      ),
    );
