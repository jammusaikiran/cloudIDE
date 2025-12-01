import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../utils/axiosInstance';
import { Code2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';
import Loader from '../components/Loader';

const CollaborationDev = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [collaborations, setCollaborations] = useState({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCollaborations();
      fetchRegisteredUsers();
    } else {
      // If no token, stop loading to show the page
      setLoading(false);
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSuggestions && !e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRegisteredUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get('/collaboration/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegisteredUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getAvailableUsers = () => {
    if (!selectedProject) return [];
    
    const existingEmails = selectedProject.collaborators?.map(c => c.email) || [];
    return registeredUsers.filter(user => 
      !existingEmails.includes(user.email) && 
      !selectedEmails.includes(user.email)
    );
  };

  const getFilteredUsers = () => {
    const available = getAvailableUsers();
    if (!searchQuery.trim()) return available;
    
    return available.filter(user => 
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSelectEmail = (email) => {
    if (!selectedEmails.includes(email)) {
      setSelectedEmails([...selectedEmails, email]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveEmail = (email) => {
    setSelectedEmails(selectedEmails.filter(e => e !== email));
  };

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get('/collaboration/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCollaborations({
        owned: response.data.ownedProjects || [],
        shared: response.data.sharedProjects || []
      });
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborators = async () => {
    if (selectedEmails.length === 0) {
      alert('Please select at least one user to add');
      return;
    }
    
    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.post('/collaboration/create', {
        projectId: selectedProject.projectId?._id || selectedProject.projectId,
        projectName: selectedProject.projectName,
        collaboratorEmails: selectedEmails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Collaboration response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Show toast with added emails
      const emailList = selectedEmails.join(', ');
      toast.success(`Added: ${emailList}`);
      
      setShowModal(false);
      setEmailInput('');
      setSelectedEmails([]);
      setSearchQuery('');
      setSelectedProject(null);
      fetchCollaborations();
    } catch (error) {
      console.error('Caught error:', error);
      console.error('Error response:', error.response);
      
      // Only show error toast for actual failures
      if (error.response && error.response.status >= 400) {
        toast.error(error.response.data?.message || 'Failed to add collaborators');
      } else {
        toast.error('Network error occurred');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCollaborator = async (collaborationId, collaboratorEmail) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post('/collaboration/remove', {
        collaborationId,
        collaboratorEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchCollaborations();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert(error.response?.data?.message || 'Failed to remove collaborator');
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const collaboratorEmails = selectedUsers.map(u => u.email);
      
      const response = await axiosInstance.post('/collaboration/project/create', {
        projectName: newProjectName.trim(),
        collaboratorEmails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowCreateModal(false);
      setNewProjectName('');
      setSelectedUsers([]);
      fetchCollaborations();
      alert('Collaborative project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || error.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.email === user.email);
      if (exists) {
        return prev.filter(u => u.email !== user.email);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleOpenProject = (projectId) => {
    console.log('Opening project with ID:', projectId);
    if (!projectId) {
      alert('Project ID is missing');
      return;
    }
    navigate(`/folder/${projectId}`);
  };

  const renderCollaborationCard = (collab, isOwned) => {
    console.log('Rendering collaboration card:', collab);
    console.log('Project ID:', collab.projectId);
    console.log('Project ID._id:', collab.projectId?._id);
    return (
    <div key={collab._id} className="collaboration-card">
      <div className="collab-header">
        <h3 onClick={() => handleOpenProject(collab.projectId?._id || collab.projectId)} className="project-title">
          {collab.projectName}
        </h3>
        {isOwned && (
          <button 
            className="add-collab-btn"
            onClick={() => {
              setSelectedProject(collab);
              setShowModal(true);
            }}
          >
            + Add Collaborators
          </button>
        )}
      </div>
      
      <div className="collab-info">
        <p className="creator">
          <strong>Creator:</strong> {collab.owner.email}
        </p>
        <p className="collab-count">
          <strong>Collaborators:</strong> {collab.collaborators.length}
        </p>
      </div>

      <div className="collaborators-list">
        <h4>Collaborator Emails:</h4>
        {collab.collaborators.length === 0 ? (
          <p className="no-collabs">No collaborators yet</p>
        ) : (
          <ul>
            {collab.collaborators.map((collaborator) => (
              <li key={collaborator._id} className="collaborator-item">
                <span className="collab-email">{collaborator.email}</span>
                <span className="collab-role">{collaborator.role}</span>
                {isOwned && (
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveCollaborator(collab._id, collaborator.email)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <Loader />;

  return (
    <div className="collaboration-dev-page">
      {/* Dashboard-style Navbar */}
      <nav className="w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Cloud IDE
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-300">{user?.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </nav>
      
      <div className="collaboration-container">
        <div className="page-header">
          <h1>Collaboration Development</h1>
          <div className="header-actions">
            <button className="create-project-btn" onClick={() => setShowCreateModal(true)}>
              + New Collaborative Project
            </button>
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <section className="owned-section">
          <h2>My Collaborative Projects ({collaborations.owned.length})</h2>
          <div className="collaborations-grid">
            {collaborations.owned.length === 0 ? (
              <p className="empty-state">No collaborative projects yet. Share your projects with others!</p>
            ) : (
              collaborations.owned.map(collab => renderCollaborationCard(collab, true))
            )}
          </div>
        </section>

        <section className="shared-section">
          <h2>Shared With Me ({collaborations.shared.length})</h2>
          <div className="collaborations-grid">
            {collaborations.shared.length === 0 ? (
              <p className="empty-state">No shared projects yet.</p>
            ) : (
              collaborations.shared.map(collab => renderCollaborationCard(collab, false))
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => !adding && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {adding && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                zIndex: 10
              }}>
                <div style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  padding: '20px 40px',
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: '8px'
                }}>
                  Adding user...
                </div>
              </div>
            )}
            <h2>Add Collaborators</h2>
            <p className="modal-subtitle">Project: {selectedProject?.projectName}</p>
            
            <div className="form-group">
              <label>Search and Select Users:</label>
              <div className="search-container" style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Type email to search..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
                
                {showSuggestions && getFilteredUsers().length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {getFilteredUsers().map(user => (
                      <div
                        key={user._id}
                        onClick={() => handleSelectEmail(user.email)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        <div style={{ fontWeight: '500', color: '#333' }}>{user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedEmails.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                    Selected Users ({selectedEmails.length}):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedEmails.map(email => (
                      <div
                        key={email}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: '#667eea',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            lineHeight: 1,
                            padding: 0
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)} disabled={adding}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleAddCollaborators} disabled={adding}>
                {adding ? 'Adding...' : 'Add Collaborators'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Collaborative Project</h2>
            
            <div className="form-group">
              <label>Project Name:</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label>Share with Registered Users ({selectedUsers.length} selected):</label>
              <div className="users-list">
                {registeredUsers.length === 0 ? (
                  <p className="no-users">No other users registered yet</p>
                ) : (
                  registeredUsers.map(user => (
                    <div
                      key={user._id}
                      className={`user-item ${selectedUsers.find(u => u.email === user.email) ? 'selected' : ''}`}
                      onClick={() => toggleUserSelection(user)}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedUsers.find(u => u.email === user.email)}
                        onChange={() => {}}
                      />
                      <span className="user-email">{user.email}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName('');
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </button>
              <button 
                className="submit-btn" 
                onClick={handleCreateProject}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        .collaboration-dev-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .collaboration-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          padding-top: 100px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .create-project-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .create-project-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .page-header h1 {
          color: white;
          font-size: 2.5rem;
          font-weight: bold;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .owned-section, .shared-section {
          margin-bottom: 3rem;
        }

        .owned-section h2, .shared-section h2 {
          color: white;
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .collaborations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 2rem;
        }

        .collaboration-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }

        .collaboration-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
        }

        .collab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
        }

        .project-title {
          font-size: 1.4rem;
          color: #667eea;
          cursor: pointer;
          margin: 0;
          transition: color 0.3s ease;
        }

        .project-title:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .add-collab-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: opacity 0.3s ease;
        }

        .add-collab-btn:hover {
          opacity: 0.9;
        }

        .collab-info {
          margin-bottom: 1rem;
        }

        .collab-info p {
          margin: 0.5rem 0;
          color: #555;
          font-size: 1rem;
        }

        .collaborators-list h4 {
          color: #333;
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
        }

        .collaborators-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .collaborator-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }

        .collab-email {
          color: #333;
          font-weight: 500;
        }

        .collab-role {
          color: #667eea;
          font-size: 0.9rem;
          text-transform: capitalize;
          margin-left: 1rem;
        }

        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.3s ease;
        }

        .remove-btn:hover {
          background: #c82333;
        }

        .no-collabs {
          color: #999;
          font-style: italic;
        }

        .empty-state {
          color: white;
          font-size: 1.1rem;
          text-align: center;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
        }

        .modal-content h2 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .modal-subtitle {
          color: #667eea;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          color: #333;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          resize: vertical;
        }

        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        .submit-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
        }

        .submit-btn:hover {
          opacity: 0.9;
        }

        .create-modal {
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .text-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }

        .users-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 0.5rem;
          background: #f8f9fa;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .user-item:hover {
          background: #f0f0f0;
        }

        .user-item.selected {
          background: #e7f3ff;
          border-color: #667eea;
        }

        .user-item input[type="checkbox"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .user-email {
          color: #333;
          font-weight: 500;
        }

        .no-users {
          color: #999;
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default CollaborationDev;
