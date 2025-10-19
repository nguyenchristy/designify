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
  const [subExpanded, setSubExpanded] = useState<{ [key: string]: { design: boolean; location: boolean } }>({});
  const [designSubExpanded, setDesignSubExpanded] = useState<{ [key: string]: { color: boolean; material: boolean; size: boolean } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black'];
  const materials = ['Wood', 'Metal', 'Plastic', 'Glass', 'Fabric'];
  const sizes = ['Large', 'Medium', 'Small'];

  useEffect(() => {
  const loadObjectData = async () => {
    try {
      const response = await fetch('/outroom-room-analysis.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch outroom-room-analysis.json: ${response.status}`);
      }

      const data = await response.json();

      // Expecting structure: { objects: [...], style: string, colorPalette: [...] }
      const dataArray = Array.isArray(data.objects) ? data.objects : [];

      const parsedObjects: ObjectData[] = dataArray.map((item: any) => ({
        ...item,
        name: item.name || 'Unknown',
        design: `Design: ${item.name}`,
        location: `Location: x=${item.x}, y=${item.y}`
      }));

      setObjects(parsedObjects);
      setError(null);

      // Optional: log or use style and colorPalette
      console.log('Room style:', data.style);
      console.log('Color palette:', data.colorPalette);
      
    } catch (error) {
      console.error('Error loading output.json:', error);
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

  const toggleDesign = (objectName: string) => {
    setSubExpanded(prev => ({
      ...prev,
      [objectName]: {
        ...prev[objectName],
        design: !prev[objectName]?.design
      }
    }));
  };

  const toggleLocation = (objectName: string) => {
    setSubExpanded(prev => ({
      ...prev,
      [objectName]: {
        ...prev[objectName],
        location: !prev[objectName]?.location
      }
    }));
  };

  const toggleColor = (objectName: string) => {
    setDesignSubExpanded(prev => ({
      ...prev,
      [objectName]: {
        ...prev[objectName],
        color: !prev[objectName]?.color
      }
    }));
  };

  const toggleMaterial = (objectName: string) => {
    setDesignSubExpanded(prev => ({
      ...prev,
      [objectName]: {
        ...prev[objectName],
        material: !prev[objectName]?.material
      }
    }));
  };

  const toggleSize = (objectName: string) => {
    setDesignSubExpanded(prev => ({
      ...prev,
      [objectName]: {
        ...prev[objectName],
        size: !prev[objectName]?.size
      }
    }));
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
                  onClick={() => toggleDesign(object.name)}
                >
                  <span className={`chevron ${subExpanded[object.name]?.design ? 'expanded' : ''}`}>
                    ▶
                  </span>
                  <span>🎨</span>
                  <span>Design</span>
                </div>
                {subExpanded[object.name]?.design && (
                  <div className="sub-dropdown-content">
                    <div 
                      className="sub-dropdown-item"
                      onClick={() => toggleColor(object.name)}
                    >
                      <span className={`chevron ${designSubExpanded[object.name]?.color ? 'expanded' : ''}`}>▶</span>
                      <span>Color</span>
                    </div>
                    {designSubExpanded[object.name]?.color && (
                      <div className="sub-sub-dropdown-content grid-view color-grid">
                        {colors.map(color => (
                          <div 
                            key={color}
                            className="color-swatch"
                            style={{ backgroundColor: color.toLowerCase() }}
                            onClick={() => handleDesignClick(`${object.name}-Color-${color}`)}
                            title={color}
                          >
                          </div>
                        ))}
                      </div>
                    )}
                    <div 
                      className="sub-dropdown-item"
                      onClick={() => toggleMaterial(object.name)}
                    >
                      <span className={`chevron ${designSubExpanded[object.name]?.material ? 'expanded' : ''}`}>▶</span>
                      <span>Material</span>
                    </div>
                    {designSubExpanded[object.name]?.material && (
                      <div className="sub-sub-dropdown-content">
                        {materials.map(material => (
                          <div 
                            key={material}
                            className="sub-sub-dropdown-item"
                            onClick={() => handleDesignClick(`${object.name}-Material-${material}`)}
                          >
                            <span>{material}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div 
                      className="sub-dropdown-item"
                      onClick={() => toggleSize(object.name)}
                    >
                      <span className={`chevron ${designSubExpanded[object.name]?.size ? 'expanded' : ''}`}>▶</span>
                      <span>Size</span>
                    </div>
                    {designSubExpanded[object.name]?.size && (
                      <div className="sub-sub-dropdown-content">
                        {sizes.map(size => (
                          <div 
                            key={size}
                            className="sub-sub-dropdown-item"
                            onClick={() => handleDesignClick(`${object.name}-Size-${size}`)}
                          >
                            <span>{size}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div 
                  className="dropdown-item"
                  onClick={() => toggleLocation(object.name)}
                >
                  <span className={`chevron ${subExpanded[object.name]?.location ? 'expanded' : ''}`}>
                    ▶
                  </span>
                  <span>📍</span>
                  <span>Location</span>
                </div>
                {subExpanded[object.name]?.location && (
                  <div className="sub-dropdown-content">
                    <div 
                      className="sub-dropdown-item"
                      onClick={() => handleLocationClick(`${object.name}-Left`)}
                    >
                      <span>Left</span>
                    </div>
                    <div 
                      className="sub-dropdown-item"
                      onClick={() => handleLocationClick(`${object.name}-Right`)}
                    >
                      <span>Right</span>
                    </div>
                    <div 
                      className="sub-dropdown-item"
                      onClick={() => handleLocationClick(`${object.name}-Center`)}
                    >
                      <span>Center</span>
                    </div>
                    <div 
                      className="sub-dropdown-item"
                      onClick={() => handleLocationClick(`${object.name}-Back`)}
                    >
                      <span>Back</span>
                    </div>
                    <div 
                      className="sub-dropdown-item"
                      onClick={() => handleLocationClick(`${object.name}-Front`)}
                    >
                      <span>Front</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidePanel;