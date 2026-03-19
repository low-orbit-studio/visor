'use client';

import { propsData, type PropDef } from '@/lib/props-data';
import styles from './props-table.module.css';

interface PropsTableProps {
  component: string;
}

export function PropsTable({ component }: PropsTableProps) {
  const props: PropDef[] | undefined = propsData[component];

  if (!props) {
    return (
      <p className={styles.empty}>
        No props data available for &ldquo;{component}&rdquo;.
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Prop</th>
            <th className={styles.th}>Type</th>
            <th className={styles.th}>Default</th>
            <th className={styles.th}>Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className={styles.tr}>
              <td className={styles.td}>
                <code className={styles.code}>{prop.name}</code>
                {prop.required && (
                  <span className={styles.required} title="Required">
                    *
                  </span>
                )}
              </td>
              <td className={styles.td}>
                <code className={styles.typeCode}>{prop.type}</code>
              </td>
              <td className={styles.td}>
                {prop.default ? (
                  <code className={styles.code}>{prop.default}</code>
                ) : (
                  <span className={styles.empty}>—</span>
                )}
              </td>
              <td className={styles.td}>{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
