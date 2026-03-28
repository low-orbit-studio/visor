'use client';

import dynamic from 'next/dynamic';
import type { SphereProps, SphereRef } from '../../../../components/visual/sphere/sphere.types';

export const Sphere = dynamic<SphereProps>(
  () => import('../../../../components/visual/sphere/sphere').then(m => m.Sphere),
  { ssr: false }
) as React.ForwardRefExoticComponent<SphereProps & React.RefAttributes<SphereRef>>;
