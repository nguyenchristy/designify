import React, { useState, useEffect } from 'react';
import './SidePanel.css';

interface ObjectData {
  name: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  design?: string;
  location?: string;
}

// Add this helper function before the SidePanel component
const formatObjectName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const SidePanel: React.FC = () => {
  const [objects, setObjects] = useState<ObjectData[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadObjectData = async () => {
      try {
        const response = await fetch('/output.txt');
        if (!response.ok) {
          throw new Error(`Failed to fetch output.txt: ${response.status}`);
        }
        const text = await response.text();
        
        // Parse JSON array from the text
        const jsonArray = JSON.parse(text);
        
        // Handle both array and single object
        const dataArray = Array.isArray(jsonArray) ? jsonArray : [jsonArray];
        
        const parsedObjects: ObjectData[] = dataArray.map((item) => ({
          ...item,
          name: item.name || 'Unknown',
          design: `Design: ${item.name}`,
          location: `Location: x=${item.x}, y=${item.y}`
        }));
        
        setObjects(parsedObjects);
        setError(null);
      } catch (error) {
        console.error('Error loading output.txt:', error);
        setError(error instanceof Error ? error.message : 'Failed to load objects');
        setObjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadObjectData();
  }, []);

  const toggleExpanded = (objectName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(objectName)) {
      newExpanded.delete(objectName);
    } else {
      newExpanded.add(objectName);
    }
    setExpandedItems(newExpanded);
  };

  const handleDesignClick = (objectName: string) => {
    console.log(`Design clicked for ${objectName}`);
  };

  const handleLocationClick = (objectName: string) => {
    console.log(`Location clicked for ${objectName}`);
  };

  if (loading) {
    return (
      <div className="side-panel">
        <div className="loading">Loading objects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="side-panel">
        <div className="side-panel-header">
          <h3>Furniture</h3>
        </div>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (objects.length === 0) {
    return (
      <div className="side-panel">
        <div className="side-panel-header">
          <h3>Objects</h3>
        </div>
        <div className="empty-state">No objects found</div>
      </div>
    );
  }

  

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h3>Furniture</h3>
      </div>
      
      <div className="side-panel-content">
        {objects.map((object) => (
          <div key={object.name} className="object-item">
            <div 
              className="object-name"
              onClick={() => toggleExpanded(object.name)}
            >
              <span className={`chevron ${expandedItems.has(object.name) ? 'expanded' : ''}`}>
                ▶
              </span>
              <span className="name">{formatObjectName(object.name)}</span>
            </div>
            
            {expandedItems.has(object.name) && (
              <div className="dropdown-content">
                <div 
                  className="dropdown-item"
                  onClick={() => handleDesignClick(object.name)}
                >
                  <span>🎨</span>
                  <span>Design</span>
                </div>
                <div 
                  className="dropdown-item"
                  onClick={() => handleLocationClick(object.name)}
                >
                  <span>📍</span>
                  <span>Location</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidePanel;