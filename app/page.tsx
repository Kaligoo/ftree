'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

interface Person {
  id: number;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  gender: string | null;
  notes: string | null;
}

interface Relationship {
  id: number;
  personId: number;
  relatedPersonId: number;
  relationType: string;
}

const nodeWidth = 180;
const nodeHeight = 60;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

export default function FamilyTreePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonBirthYear, setNewPersonBirthYear] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [peopleRes, relationshipsRes] = await Promise.all([
        fetch('/api/people'),
        fetch('/api/relationships'),
      ]);

      const peopleData = await peopleRes.json();
      const relationshipsData = await relationshipsRes.json();

      setPeople(peopleData);
      setRelationships(relationshipsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  // Convert data to React Flow nodes and edges
  useEffect(() => {
    const newNodes: Node[] = people.map((person) => ({
      id: person.id.toString(),
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="font-semibold">{person.name}</div>
            {person.birthYear && (
              <div className="text-xs text-gray-600">
                {person.birthYear}{person.deathYear ? ` - ${person.deathYear}` : ''}
              </div>
            )}
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: person.gender === 'male' ? '#DBEAFE' : person.gender === 'female' ? '#FCE7F3' : '#F3F4F6',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '10px',
        width: nodeWidth,
      },
    }));

    const newEdges: Edge[] = relationships.map((rel) => ({
      id: `${rel.personId}-${rel.relatedPersonId}`,
      source: rel.personId.toString(),
      target: rel.relatedPersonId.toString(),
      label: rel.relationType,
      type: rel.relationType === 'spouse' ? 'step' : 'smoothstep',
      animated: false,
      style: {
        stroke: rel.relationType === 'spouse' ? '#EF4444' : '#3B82F6',
        strokeWidth: 2,
      },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [people, relationships, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addPerson = async () => {
    if (!newPersonName.trim()) return;

    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPersonName,
          birthYear: newPersonBirthYear ? parseInt(newPersonBirthYear) : null,
        }),
      });

      if (response.ok) {
        setNewPersonName('');
        setNewPersonBirthYear('');
        setShowAddForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to add person:', error);
    }
  };

  return (
    <div className="w-screen h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Family Tree</h1>

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Person
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="number"
                placeholder="Birth Year"
                value={newPersonBirthYear}
                onChange={(e) => setNewPersonBirthYear(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <div className="flex gap-2">
                <button
                  onClick={addPerson}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPersonName('');
                    setNewPersonBirthYear('');
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            <p>Total People: {people.length}</p>
            <p className="text-xs mt-2">
              Use mouse wheel to zoom<br />
              Drag to pan around
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
