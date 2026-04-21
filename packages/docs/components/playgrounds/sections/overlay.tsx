"use client";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import styles from "./section.module.css";

export function OverlaySection() {
  return (
    <TooltipProvider>
      <div className={styles.root}>
        <p className={styles.lede}>Dialog, popover, tooltip, hover card. Click to open.</p>

        <div className={styles.row}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename project</DialogTitle>
                <DialogDescription>Give this project a new name. Changes propagate everywhere.</DialogDescription>
              </DialogHeader>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <Button variant="outline">Cancel</Button>
                <Button>Save</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <p style={{ margin: 0 }}>Popover content goes here.</p>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover for tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline">Hover card</Button>
            </HoverCardTrigger>
            <HoverCardContent>
              <p style={{ margin: 0 }}>Rich preview content on hover.</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </TooltipProvider>
  );
}
