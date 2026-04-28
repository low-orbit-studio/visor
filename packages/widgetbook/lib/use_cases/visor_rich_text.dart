import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_rich_text/visor_rich_text.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Default', type: VisorRichText)
Widget defaultUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(24),
      child: VisorRichText(
        text: context.knobs.string(
          label: 'Text',
          initialValue:
              'Read our terms at https://example.com/terms before signing up.',
        ),
      ),
    );

@widgetbook.UseCase(name: 'Multiple Links', type: VisorRichText)
Widget multipleLinksUseCase(BuildContext context) => const Padding(
      padding: EdgeInsets.all(24),
      child: VisorRichText(
        text:
            'See https://visor.design and the playbook at https://github.com/low-orbit-studio for full context.',
      ),
    );

@widgetbook.UseCase(name: 'Long Paragraph', type: VisorRichText)
Widget longParagraphUseCase(BuildContext context) => const Padding(
      padding: EdgeInsets.all(24),
      child: VisorRichText(
        text:
            'By creating an account you agree to our Terms of Service at '
            'https://example.com/terms and acknowledge the Privacy Policy at '
            'https://example.com/privacy. You can withdraw consent at any time '
            'by visiting https://example.com/account/preferences.',
      ),
    );

@widgetbook.UseCase(name: 'Non-Selectable', type: VisorRichText)
Widget nonSelectableUseCase(BuildContext context) => const Padding(
      padding: EdgeInsets.all(24),
      child: VisorRichText(
        text: 'Compact mode — selection disabled. Open https://example.com.',
        selectable: false,
      ),
    );

@widgetbook.UseCase(name: 'Centered', type: VisorRichText)
Widget centeredUseCase(BuildContext context) => const Padding(
      padding: EdgeInsets.all(24),
      child: VisorRichText(
        text:
            'Centered disclosure copy. See https://example.com for the policy.',
        textAlign: TextAlign.center,
      ),
    );

@widgetbook.UseCase(name: 'No URLs', type: VisorRichText)
Widget noUrlsUseCase(BuildContext context) => const Padding(
      padding: EdgeInsets.all(24),
      child: VisorRichText(
        text:
            'Plain prose with no embedded URLs renders identically to a Text widget.',
      ),
    );
