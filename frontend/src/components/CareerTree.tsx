"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
    Position,
    Handle,
    NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, BookOpen, Star, ChevronRight, Award, X, Loader2, BadgeCheck, Briefcase, Users } from 'lucide-react';

// ─────────────────────────────────────────────
// Custom node: Career Role
// ─────────────────────────────────────────────
function CareerNode({ data, selected }: NodeProps) {
    return (
        <div
            className={`px-5 py-4 rounded-2xl border transition-all duration-200 min-w-[220px] cursor-pointer
                ${data.isCurrent
                    ? 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : selected
                        ? 'bg-blue-950/80 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                }`}
        >
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className="font-bold text-white text-base leading-tight">{data.label}</div>
            {data.isCurrent && (
                <span className="mt-2 inline-block text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    Current Role
                </span>
            )}
            {!data.isCurrent && (
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                    <Star size={11} className="text-yellow-500" />
                    Click for certs & details
                </div>
            )}
            {data.loading && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                    <Loader2 size={12} className="animate-spin" /> Fetching certs…
                </div>
            )}
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
}

// ─────────────────────────────────────────────
// Custom node: Certification
// ─────────────────────────────────────────────
function CertNode({ data }: NodeProps) {
    const difficultyColor: Record<string, string> = {
        Beginner:     'text-green-400 border-green-500/40 bg-green-500/10',
        Intermediate: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
        Advanced:     'text-red-400   border-red-500/40   bg-red-500/10',
    };
    const color = difficultyColor[data.difficulty] ?? 'text-purple-400 border-purple-500/40 bg-purple-500/10';

    return (
        <div className={`px-4 py-3 rounded-xl border min-w-[190px] max-w-[220px] ${color} shadow-md`}>
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className="flex items-start gap-2">
                <BadgeCheck size={16} className="mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold text-white text-sm leading-tight">{data.name}</p>
                    {data.examCode && (
                        <p className="text-xs font-mono mt-0.5 opacity-70">{data.examCode}</p>
                    )}
                    <p className="text-xs mt-1 opacity-60">{data.provider}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                        <Clock size={10} /> {data.estimatedHours}h study
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Custom node: Responsibility
// ─────────────────────────────────────────────
function RespNode({ data }: NodeProps) {
    return (
        <div className="px-4 py-3 rounded-xl border min-w-[200px] max-w-[240px] text-orange-400 border-orange-500/40 bg-orange-500/10 shadow-md">
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className="flex items-start gap-2">
                <Briefcase size={16} className="mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold text-white text-sm leading-tight">Responsibilities</p>
                    <div className="mt-2 space-y-1">
                        {data.coreResponsibilities.map((r: string, i: number) => (
                            <p key={i} className="text-xs opacity-80 flex items-start gap-1">
                                <span className="text-orange-400 mt-0.5">•</span>
                                <span>{r}</span>
                            </p>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-orange-500/20 text-xs opacity-90">
                        <Users size={12} /> Team: {data.peopleManaged}
                        {data.budgetManaged && data.budgetManaged !== "None" && (
                            <span className="ml-2 bg-orange-500/20 px-1.5 py-0.5 rounded">
                                Budget: {data.budgetManaged}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const nodeTypes = { career: CareerNode, cert: CertNode, resp: RespNode };

// ─────────────────────────────────────────────
// Radial layout for cert nodes around a parent
// ─────────────────────────────────────────────
function certPositions(parentX: number, parentY: number, count: number) {
    const radius = 220;
    return Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI / (count + 1)) * (i + 1) + Math.PI * 0.25;
        return {
            x: parentX + radius * Math.cos(angle),
            y: parentY + radius * Math.sin(angle) + 80,
        };
    });
}

// ─────────────────────────────────────────────
// Main CareerTree Component
// ─────────────────────────────────────────────
export default function CareerTree({ graphData, profileData }: { graphData: any; profileData: any }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode]   = useState<any>(null);
    const [selectedEdge, setSelectedEdge]   = useState<any>(null);
    // Track which career nodes already have certs attached
    const [certifiedNodes, setCertifiedNodes] = useState<Set<string>>(new Set());

    // Build initial graph from backend data
    useEffect(() => {
        if (!graphData) return;

        const initialNodes = graphData.nodes.map((n: any, i: number) => ({
            id: n.id,
            type: 'career',
            position: { x: 300 + (i % 3 - 1) * 340, y: Math.floor(i / 3) * 230 },
            data: { label: n.job_title, isCurrent: n.is_current, raw: n, loading: false },
        }));

        const initialEdges = graphData.edges.map((e: any) => ({
            id: `${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            data: e.transition_requirements,
        }));

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [graphData]);

    // Toggle certifications attachment on/off
    const toggleCerts = useCallback(async (node: any) => {
        if (node.data.isCurrent) return;

        // If certs are already attached, clicking again removes them
        if (certifiedNodes.has(node.id)) {
            setNodes((nds) => nds.filter((n) => !n.id.startsWith(`${node.id}_cert_`) && !n.id.startsWith(`${node.id}_resp_`)));
            setEdges((eds) => eds.filter((e) => !e.id.startsWith(`${node.id}-cert_`) && !e.id.startsWith(`${node.id}-resp_`)));
            setCertifiedNodes((prev) => {
                const newSet = new Set(prev);
                newSet.delete(node.id);
                return newSet;
            });
            return;
        }

        // Mark as loading
        setNodes((nds) => nds.map((n) =>
            n.id === node.id ? { ...n, data: { ...n.data, loading: true } } : n
        ));

        // Find transition requirements for this node
        const edge = graphData.edges.find((e: any) => e.target === node.id);
        const skills = edge?.transition_requirements?.skills_to_acquire ?? [];

        try {
            const [certRes, respRes] = await Promise.all([
                fetch('http://localhost:8000/api/v1/certifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ job_title: node.data.label, skills_to_acquire: skills }),
                }),
                fetch('http://localhost:8000/api/v1/responsibilities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ job_title: node.data.label }),
                })
            ]);
            if (!certRes.ok || !respRes.ok) throw new Error('API error');
            const { certifications } = await certRes.json();
            const { responsibility } = await respRes.json();

            const positions = certPositions(node.position.x, node.position.y, certifications.length);

            const certNodes = certifications.map((c: any, idx: number) => ({
                id: `${node.id}_cert_${c.id}`,
                type: 'cert',
                position: positions[idx],
                data: {
                    name: c.name,
                    provider: c.provider,
                    difficulty: c.difficulty,
                    estimatedHours: c.estimated_hours,
                    examCode: c.exam_code,
                    skillsCovered: c.skills_covered,
                },
            }));

            const certEdges = certifications.map((c: any) => ({
                id: `${node.id}-cert_${c.id}`,
                source: node.id,
                target: `${node.id}_cert_${c.id}`,
                style: { stroke: '#a855f7', strokeWidth: 1.5, strokeDasharray: '4 3' },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
            }));

            const respNodeId = `${node.id}_resp_${responsibility.id}`;
            const respNode = {
                id: respNodeId,
                type: 'resp',
                position: { x: node.position.x - 260, y: node.position.y + 100 },
                data: {
                    coreResponsibilities: responsibility.core_responsibilities,
                    peopleManaged: responsibility.people_managed,
                    budgetManaged: responsibility.budget_managed,
                },
            };

            const respEdge = {
                id: `${node.id}-resp_${responsibility.id}`,
                source: node.id,
                target: respNodeId,
                style: { stroke: '#f97316', strokeWidth: 1.5, strokeDasharray: '4 3' },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
            };

            setNodes((nds) => [
                ...nds.map((n) =>
                    n.id === node.id ? { ...n, data: { ...n.data, loading: false } } : n
                ),
                ...certNodes,
                respNode,
            ]);
            setEdges((eds) => [...eds, ...certEdges, respEdge]);
            setCertifiedNodes((prev) => new Set(prev).add(node.id));

        } catch {
            setNodes((nds) => nds.map((n) =>
                n.id === node.id ? { ...n, data: { ...n.data, loading: false } } : n
            ));
        }
    }, [graphData, certifiedNodes]);

    const onNodeClick = useCallback((_: any, node: any) => {
        if (node.type === 'cert') return; // clicking cert node does nothing extra
        setSelectedNode(node);
        const edge = graphData.edges.find((e: any) => e.target === node.id);
        setSelectedEdge(edge ? edge.transition_requirements : null);
        // Toggle certs on click
        toggleCerts(node);
    }, [graphData, toggleCerts]);

    const calculateScore = (reqSkills: string[]) => {
        if (!reqSkills?.length) return 100;
        const profileText = profileData?.extracted_skills?.join(' ').toLowerCase() ?? '';
        const matched = reqSkills.filter((s) => profileText.includes(s.toLowerCase())).length;
        return Math.min(100, Math.floor((matched / reqSkills.length) * 100) + 10);
    };

    return (
        <div className="w-full h-full relative bg-slate-950">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
            >
                <Background color="#1e293b" gap={20} size={1} />
                <Controls className="bg-slate-800 border-slate-700 fill-slate-300" />
            </ReactFlow>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-xl p-3 text-xs text-slate-400">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Current Role</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Target Role</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Certification</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Responsibilities</div>
                <p className="text-slate-500 mt-1">Click any role → details appear</p>
            </div>

            {/* Side panel */}
            <AnimatePresence>
                {selectedNode && selectedNode.type === 'career' && (
                    <motion.div
                        initial={{ opacity: 0, x: 320 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 320 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="absolute top-4 right-4 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 z-10 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">{selectedNode.data.label}</h2>
                                <p className="text-sm mt-1">
                                    {selectedNode.data.isCurrent
                                        ? <span className="text-emerald-400">Your Current Position</span>
                                        : <span className="text-blue-400">Target Role</span>}
                                </p>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {selectedNode.data.isCurrent ? (
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-slate-300 text-sm leading-relaxed">
                                You are here. Click any target role node above to explore career paths and have certifications suggested automatically.
                            </div>
                        ) : selectedEdge && (
                            <div className="space-y-5">
                                {/* Score */}
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-slate-300 font-medium flex items-center gap-2">
                                            <Trophy size={16} className="text-yellow-400" /> Readiness Score
                                        </span>
                                        <span className="text-white font-bold text-xl">{calculateScore(selectedEdge.skills_to_acquire)}/100</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${calculateScore(selectedEdge.skills_to_acquire)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Skills */}
                                <div>
                                    <h3 className="text-white font-semibold flex items-center gap-2 mb-3 text-sm">
                                        <Star size={14} className="text-blue-400" /> Skills to Acquire
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEdge.skills_to_acquire.map((s: string, i: number) => (
                                            <span key={i} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Courses */}
                                <div>
                                    <h3 className="text-white font-semibold flex items-center gap-2 mb-3 text-sm">
                                        <BookOpen size={14} className="text-purple-400" /> Recommended Modules
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedEdge.recommended_courses.map((c: string, i: number) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-800/50 px-3 py-2.5 rounded-lg border border-slate-700/30 hover:border-slate-500 transition-colors">
                                                <span className="text-slate-200 text-xs">{c}</span>
                                                <ChevronRight size={14} className="text-slate-500 shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-2 text-slate-400 bg-slate-800/30 px-3 py-2.5 rounded-lg text-sm">
                                    <Clock size={14} />
                                    Estimated: {selectedEdge.estimated_time_months} months
                                </div>

                                {/* Cert status */}
                                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border
                                    ${certifiedNodes.has(selectedNode.id)
                                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                        : selectedNode.data.loading
                                            ? 'bg-slate-800/30 border-slate-700 text-slate-400'
                                            : 'bg-slate-800/30 border-slate-700 text-slate-500'}`}
                                >
                                    {certifiedNodes.has(selectedNode.id) ? (
                                        <><BadgeCheck size={14} /> Details attached to graph</>
                                    ) : selectedNode.data.loading ? (
                                        <><Loader2 size={14} className="animate-spin" /> Fetching details…</>
                                    ) : (
                                        <><Award size={14} /> Details loading on graph…</>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
