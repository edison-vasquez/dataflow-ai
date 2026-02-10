"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { WorkspaceView } from "@/components/workspace/WorkspaceView";
import { PreparationView } from "@/components/preparation/PreparationView";
import { ExplorationView } from "@/components/exploration/ExplorationView";
import { ReportsView } from "@/components/reports/ReportsView";

export default function AppPage() {
    const { currentPhase, projectId, initProject } = useAppStore();

    useEffect(() => {
        if (!projectId) {
            initProject();
        }
    }, [projectId, initProject]);

    return (
        <div className="h-full">
            {currentPhase === 'workspace' && <WorkspaceView />}
            {currentPhase === 'preparation' && <PreparationView />}
            {currentPhase === 'exploration' && <ExplorationView />}
            {currentPhase === 'reports' && <ReportsView />}
        </div>
    );
}
