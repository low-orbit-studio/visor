import 'package:alchemist/alchemist.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../_test_helpers/golden.dart';
import 'visor_button.dart';

GoldenTestScenario _scenario({
  required String name,
  required String label,
  required VisorButtonStyle style,
  required VisorButtonSize size,
  required Brightness brightness,
}) {
  return GoldenTestScenario(
    name: name,
    child: goldenWrap(
      VisorButton(
        label: label,
        onPressed: () {},
        style: style,
        size: size,
      ),
      brightness: brightness,
    ),
  );
}

void main() {
  group('VisorButton golden', () {
    for (final brightness in [Brightness.light, Brightness.dark]) {
      final mode = brightness == Brightness.light ? 'light' : 'dark';
      for (final size in VisorButtonSize.values) {
        goldenTest(
          'styles — $mode — ${size.name}',
          fileName: 'visor_button_${mode}_${size.name}',
          builder: () => GoldenTestGroup(
            scenarioConstraints: const BoxConstraints(maxWidth: 200),
            children: [
              _scenario(
                name: 'primary',
                label: 'Save',
                style: VisorButtonStyle.primary,
                size: size,
                brightness: brightness,
              ),
              _scenario(
                name: 'secondary',
                label: 'Cancel',
                style: VisorButtonStyle.secondary,
                size: size,
                brightness: brightness,
              ),
              _scenario(
                name: 'ghost',
                label: 'Skip',
                style: VisorButtonStyle.ghost,
                size: size,
                brightness: brightness,
              ),
              _scenario(
                name: 'destructive',
                label: 'Delete',
                style: VisorButtonStyle.destructive,
                size: size,
                brightness: brightness,
              ),
            ],
          ),
        );
      }
    }
  });
}
