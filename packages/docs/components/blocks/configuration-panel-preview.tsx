'use client';

import { useState } from 'react';
import { ConfigurationPanel } from '../../../../blocks/configuration-panel/configuration-panel';
import { SliderControl } from '../../../../components/ui/slider-control/slider-control';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group/toggle-group';
import { Button } from '../../../../components/ui/button/button';

export function ConfigurationPanelPreview() {
  const [mode, setMode] = useState('sphere');
  const [size, setSize] = useState(50);
  const [blur, setBlur] = useState(30);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', width: '100%' }}>
      <ConfigurationPanel
        title="Controls"
        subtitle="Adjust parameters"
        className="configuration-panel-preview"
        sections={[
          {
            label: "Geometry",
            children: (
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(v) => v && setMode(v)}
                variant="outline"
                size="sm"
                style={{ width: '100%' }}
              >
                <ToggleGroupItem value="sphere" style={{ flex: 1, justifyContent: 'center' }}>Sphere</ToggleGroupItem>
                <ToggleGroupItem value="curl" style={{ flex: 1, justifyContent: 'center' }}>Curl</ToggleGroupItem>
                <ToggleGroupItem value="lorenz" style={{ flex: 1, justifyContent: 'center' }}>Lorenz</ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            label: "Appearance",
            children: (
              <>
                <SliderControl label="Size" value={size} onValueChange={setSize} displayValue={size.toString()} max={100} step={1} />
                <SliderControl label="Blur" value={blur} onValueChange={setBlur} displayValue={(blur / 100).toFixed(2)} max={100} step={1} />
              </>
            ),
          },
          {
            label: "Actions",
            children: (
              <Button variant="outline" size="sm" onClick={() => { setSize(50); setBlur(30); setMode('sphere'); }}>Reset</Button>
            ),
          },
        ]}
      />
    </div>
  );
}
