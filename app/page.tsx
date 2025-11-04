'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
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
  Handle,
  Position,
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

const getLayoutedElements = (nodes: Node[], edges: Edge[], relationships: Relationship[]) => {
  // Build spouse pairs map
  const spousePairs = new Map<string, string>();
  relationships.forEach((rel) => {
    if (rel.relationType === 'spouse') {
      const id1 = rel.personId.toString();
      const id2 = rel.relatedPersonId.toString();
      spousePairs.set(id1, id2);
      spousePairs.set(id2, id1);
    }
  });

  // Build parent-child relationships map
  const parentToChildren = new Map<string, string[]>();
  const childToParents = new Map<string, string[]>();

  relationships.forEach((rel) => {
    if (rel.relationType === 'child') {
      const parentId = rel.personId.toString();
      const childId = rel.relatedPersonId.toString();

      if (!parentToChildren.has(parentId)) {
        parentToChildren.set(parentId, []);
      }
      parentToChildren.get(parentId)!.push(childId);

      if (!childToParents.has(childId)) {
        childToParents.set(childId, []);
      }
      childToParents.get(childId)!.push(parentId);
    }
  });

  // First, use dagre for initial layout with only parent-child edges
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Only add parent-child edges to dagre for hierarchy
  edges.forEach((edge) => {
    const rel = relationships.find(
      (r) =>
        (r.personId.toString() === edge.source && r.relatedPersonId.toString() === edge.target) ||
        (r.personId.toString() === edge.target && r.relatedPersonId.toString() === edge.source)
    );
    if (rel?.relationType === 'child') {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  // Position spouses side by side and center children below them
  const processedSpouses = new Set<string>();
  const processedChildren = new Set<string>();

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    if (processedSpouses.has(node.id) || processedChildren.has(node.id)) {
      return; // Already positioned
    }

    const spouseId = spousePairs.get(node.id);

    if (spouseId && !processedSpouses.has(spouseId)) {
      // Position spouses side by side
      const spouseNode = nodes.find((n) => n.id === spouseId);
      if (spouseNode) {
        const spousePosition = dagreGraph.node(spouseId);
        const sharedY = Math.min(nodeWithPosition.y, spousePosition.y);

        // Position the spouse pair
        const centerX = nodeWithPosition.x;
        node.position = {
          x: centerX - nodeWidth / 2 - 100,
          y: sharedY - nodeHeight / 2,
        };

        spouseNode.position = {
          x: centerX - nodeWidth / 2 + 100,
          y: sharedY - nodeHeight / 2,
        };

        processedSpouses.add(node.id);
        processedSpouses.add(spouseId);

        // Get children of this couple
        const children1 = parentToChildren.get(node.id) || [];
        const children2 = parentToChildren.get(spouseId) || [];
        const sharedChildren = children1.filter((child) => children2.includes(child));

        if (sharedChildren.length > 0) {
          // Center children below the couple
          const totalWidth = (sharedChildren.length - 1) * (nodeWidth + 50);
          const startX = centerX - totalWidth / 2;

          sharedChildren.forEach((childId, index) => {
            const childNode = nodes.find((n) => n.id === childId);
            if (childNode) {
              const childPosition = dagreGraph.node(childId);
              childNode.position = {
                x: startX + index * (nodeWidth + 50) - nodeWidth / 2,
                y: childPosition.y - nodeHeight / 2,
              };
              processedChildren.add(childId);
            }
          });
        }
      }
    } else if (!spouseId && !processedChildren.has(node.id)) {
      // No spouse, check if this person has children
      const children = parentToChildren.get(node.id) || [];

      if (children.length > 0) {
        // Single parent with children
        const centerX = nodeWithPosition.x;
        node.position = {
          x: centerX - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        };

        // Center children below single parent
        const totalWidth = (children.length - 1) * (nodeWidth + 50);
        const startX = centerX - totalWidth / 2;

        children.forEach((childId, index) => {
          const childNode = nodes.find((n) => n.id === childId);
          if (childNode) {
            const childPosition = dagreGraph.node(childId);
            childNode.position = {
              x: startX + index * (nodeWidth + 50) - nodeWidth / 2,
              y: childPosition.y - nodeHeight / 2,
            };
            processedChildren.add(childId);
          }
        });
      } else {
        // No spouse and no children, use dagre position
        node.position = {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        };
      }
    }
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
  const [newPersonGender, setNewPersonGender] = useState<'male' | 'female' | ''>('');
  const [parent1Search, setParent1Search] = useState('');
  const [parent2Search, setParent2Search] = useState('');
  const [selectedParent1, setSelectedParent1] = useState<Person | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<Person | null>(null);
  const [childSearch, setChildSearch] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<Person[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showParent1Suggestions, setShowParent1Suggestions] = useState(false);
  const [showParent2Suggestions, setShowParent2Suggestions] = useState(false);
  const [showChildSuggestions, setShowChildSuggestions] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editName, setEditName] = useState('');
  const [editBirthYear, setEditBirthYear] = useState('');
  const [editDeathYear, setEditDeathYear] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | ''>('');

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Close suggestion dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.autocomplete-parent1')) {
        setShowParent1Suggestions(false);
      }
      if (!target.closest('.autocomplete-parent2')) {
        setShowParent2Suggestions(false);
      }
      if (!target.closest('.autocomplete-children')) {
        setShowChildSuggestions(false);
      }
      if (!target.closest('.context-menu')) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [peopleRes, relationshipsRes] = await Promise.all([
        fetch('/ftree/api/people'),
        fetch('/ftree/api/relationships'),
      ]);

      if (!peopleRes.ok || !relationshipsRes.ok) {
        console.error('API request failed');
        return;
      }

      const peopleData = await peopleRes.json();
      const relationshipsData = await relationshipsRes.json();

      // Ensure data is an array before setting state
      if (Array.isArray(peopleData)) {
        setPeople(peopleData);
      }
      if (Array.isArray(relationshipsData)) {
        setRelationships(relationshipsData);
      }
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
          <div className="text-center relative">
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Left} id="left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
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
      type: rel.relationType === 'spouse' ? 'straight' : 'step',
      animated: false,
      sourceHandle: rel.relationType === 'spouse' ? 'right' : 'bottom',
      targetHandle: rel.relationType === 'spouse' ? 'left' : 'top',
      style: {
        stroke: rel.relationType === 'spouse' ? '#9CA3AF' : '#3B82F6',
        strokeWidth: rel.relationType === 'spouse' ? 1 : 2,
        strokeDasharray: rel.relationType === 'spouse' ? '5,5' : undefined,
      },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, relationships);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [people, relationships, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Filter people based on search input
  const getFilteredPeople = (searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    return people.filter((person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const resetForm = () => {
    setNewPersonName('');
    setNewPersonBirthYear('');
    setNewPersonGender('');
    setParent1Search('');
    setParent2Search('');
    setSelectedParent1(null);
    setSelectedParent2(null);
    setChildSearch('');
    setSelectedChildren([]);
    setShowAddForm(false);
    setShowParent1Suggestions(false);
    setShowParent2Suggestions(false);
    setShowChildSuggestions(false);
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) return;

    try {
      // First, create the person
      const response = await fetch('/ftree/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPersonName,
          birthYear: newPersonBirthYear ? parseInt(newPersonBirthYear) : null,
          gender: newPersonGender || null,
        }),
      });

      if (response.ok) {
        const newPerson = await response.json();

        // Create relationships for parents
        if (selectedParent1) {
          await fetch('/ftree/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personId: selectedParent1.id,
              relatedPersonId: newPerson.id,
              relationType: 'child',
            }),
          });
        }

        if (selectedParent2) {
          await fetch('/ftree/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personId: selectedParent2.id,
              relatedPersonId: newPerson.id,
              relationType: 'child',
            }),
          });
        }

        // Create relationships for children
        for (const child of selectedChildren) {
          await fetch('/ftree/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personId: newPerson.id,
              relatedPersonId: child.id,
              relationType: 'child',
            }),
          });
        }

        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to add person:', error);
    }
  };

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const handleEditPerson = () => {
    if (!contextMenu) return;
    const person = people.find((p) => p.id.toString() === contextMenu.nodeId);
    if (!person) return;

    setEditingPerson(person);
    setEditName(person.name);
    setEditBirthYear(person.birthYear?.toString() || '');
    setEditDeathYear(person.deathYear?.toString() || '');
    setEditGender((person.gender as 'male' | 'female') || '');
    setShowEditDialog(true);
    setContextMenu(null);
  };

  const saveEditPerson = async () => {
    if (!editingPerson) return;

    try {
      const response = await fetch(`/ftree/api/people/${editingPerson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          birthYear: editBirthYear ? parseInt(editBirthYear) : null,
          deathYear: editDeathYear ? parseInt(editDeathYear) : null,
          gender: editGender || null,
        }),
      });

      if (response.ok) {
        setShowEditDialog(false);
        setEditingPerson(null);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update person:', error);
    }
  };

  const handleDeletePerson = async () => {
    if (!contextMenu) return;
    if (!confirm('Are you sure you want to delete this person? This will also delete all their relationships.')) {
      return;
    }

    try {
      const response = await fetch(`/ftree/api/people/${contextMenu.nodeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContextMenu(null);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete person:', error);
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
        onNodeContextMenu={handleNodeContextMenu}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Family Tree</h1>

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
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
              <input
                type="number"
                placeholder="Birth Year"
                value={newPersonBirthYear}
                onChange={(e) => setNewPersonBirthYear(e.target.value)}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
              <select
                value={newPersonGender}
                onChange={(e) => setNewPersonGender(e.target.value as 'male' | 'female' | '')}
                className="w-full px-3 py-2 border rounded text-gray-900"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              {/* Parent 1 Autocomplete */}
              <div className="relative autocomplete-parent1">
                <input
                  type="text"
                  placeholder="Parent 1 (optional)"
                  value={selectedParent1 ? selectedParent1.name : parent1Search}
                  onChange={(e) => {
                    setParent1Search(e.target.value);
                    setSelectedParent1(null);
                    setShowParent1Suggestions(true);
                  }}
                  onFocus={() => setShowParent1Suggestions(true)}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                />
                {showParent1Suggestions && parent1Search && !selectedParent1 && (
                  <div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-40 overflow-y-auto">
                    {getFilteredPeople(parent1Search).map((person) => (
                      <div
                        key={person.id}
                        onClick={() => {
                          setSelectedParent1(person);
                          setParent1Search('');
                          setShowParent1Suggestions(false);
                        }}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-gray-900"
                      >
                        {person.name} {person.birthYear ? `(${person.birthYear})` : ''}
                      </div>
                    ))}
                    {getFilteredPeople(parent1Search).length === 0 && (
                      <div className="px-3 py-2 text-gray-600">No matches found</div>
                    )}
                  </div>
                )}
                {selectedParent1 && (
                  <button
                    onClick={() => {
                      setSelectedParent1(null);
                      setParent1Search('');
                    }}
                    className="absolute right-2 top-2 text-gray-500 hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Parent 2 Autocomplete */}
              <div className="relative autocomplete-parent2">
                <input
                  type="text"
                  placeholder="Parent 2 (optional)"
                  value={selectedParent2 ? selectedParent2.name : parent2Search}
                  onChange={(e) => {
                    setParent2Search(e.target.value);
                    setSelectedParent2(null);
                    setShowParent2Suggestions(true);
                  }}
                  onFocus={() => setShowParent2Suggestions(true)}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                />
                {showParent2Suggestions && parent2Search && !selectedParent2 && (
                  <div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-40 overflow-y-auto">
                    {getFilteredPeople(parent2Search).map((person) => (
                      <div
                        key={person.id}
                        onClick={() => {
                          setSelectedParent2(person);
                          setParent2Search('');
                          setShowParent2Suggestions(false);
                        }}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-gray-900"
                      >
                        {person.name} {person.birthYear ? `(${person.birthYear})` : ''}
                      </div>
                    ))}
                    {getFilteredPeople(parent2Search).length === 0 && (
                      <div className="px-3 py-2 text-gray-600">No matches found</div>
                    )}
                  </div>
                )}
                {selectedParent2 && (
                  <button
                    onClick={() => {
                      setSelectedParent2(null);
                      setParent2Search('');
                    }}
                    className="absolute right-2 top-2 text-gray-500 hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Children Autocomplete */}
              <div className="relative autocomplete-children">
                <input
                  type="text"
                  placeholder="Add child (optional)"
                  value={childSearch}
                  onChange={(e) => {
                    setChildSearch(e.target.value);
                    setShowChildSuggestions(true);
                  }}
                  onFocus={() => setShowChildSuggestions(true)}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                />
                {showChildSuggestions && childSearch && (
                  <div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-40 overflow-y-auto">
                    {getFilteredPeople(childSearch)
                      .filter((person) => !selectedChildren.find((c) => c.id === person.id))
                      .map((person) => (
                        <div
                          key={person.id}
                          onClick={() => {
                            setSelectedChildren([...selectedChildren, person]);
                            setChildSearch('');
                            setShowChildSuggestions(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-gray-900"
                        >
                          {person.name} {person.birthYear ? `(${person.birthYear})` : ''}
                        </div>
                      ))}
                    {getFilteredPeople(childSearch).filter((p) => !selectedChildren.find((c) => c.id === p.id)).length === 0 && (
                      <div className="px-3 py-2 text-gray-600">No matches found</div>
                    )}
                  </div>
                )}
                {selectedChildren.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedChildren.map((child) => (
                      <div
                        key={child.id}
                        className="bg-blue-100 text-gray-900 px-2 py-1 rounded text-sm flex items-center gap-1"
                      >
                        {child.name}
                        <button
                          onClick={() => {
                            setSelectedChildren(selectedChildren.filter((c) => c.id !== child.id));
                          }}
                          className="text-gray-600 hover:text-red-500 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addPerson}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-900">
            <p className="font-medium">Total People: {people.length}</p>
            <p className="text-xs mt-2 text-gray-700">
              Use mouse wheel to zoom<br />
              Drag to pan around
            </p>
          </div>
        </Panel>
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu fixed bg-white border-2 border-gray-300 rounded shadow-lg z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleEditPerson}
            className="block w-full text-left px-4 py-2 hover:bg-blue-100 text-gray-900"
          >
            Edit
          </button>
          <button
            onClick={handleDeletePerson}
            className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
          >
            Delete
          </button>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && editingPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Person</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
              <input
                type="number"
                placeholder="Birth Year"
                value={editBirthYear}
                onChange={(e) => setEditBirthYear(e.target.value)}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
              <input
                type="number"
                placeholder="Death Year (optional)"
                value={editDeathYear}
                onChange={(e) => setEditDeathYear(e.target.value)}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as 'male' | 'female' | '')}
                className="w-full px-3 py-2 border rounded text-gray-900"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveEditPerson}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingPerson(null);
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
