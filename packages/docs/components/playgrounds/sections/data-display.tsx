"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import styles from "./section.module.css";

const ROWS = [
  { name: "Ada Lovelace", role: "Admin", status: "Active" },
  { name: "Grace Hopper", role: "Editor", status: "Active" },
  { name: "Alan Turing", role: "Viewer", status: "Invited" },
];

export function DataDisplaySection() {
  return (
    <div className={styles.root}>
      <p className={styles.lede}>Cards, tables, avatars, stat cards, separators.</p>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Stat cards</h3>
        <div className={styles.grid}>
          <StatCard label="Revenue" value="$128,400" delta={{ direction: "up", value: "+12% MoM" }} />
          <StatCard label="New users" value="2,341" delta={{ direction: "up", value: "+4.2%" }} />
          <StatCard label="Churn" value="1.8%" delta={{ direction: "down", value: "-0.3pt" }} />
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Table</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((r) => (
              <TableRow key={r.name}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell>{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupHeading}>Card + avatar</h3>
        <Card style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Avatar>
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>Ada Lovelace</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.75 }}>ada@example.com</div>
            </div>
          </div>
          <Separator style={{ margin: "1rem 0" }} />
          <p style={{ margin: 0 }}>Recent activity and contextual details would sit here.</p>
        </Card>
      </section>
    </div>
  );
}
