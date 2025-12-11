import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSignOutAlt, 
  FaSearch, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaBox,
  FaChartBar,
  FaFilter
} from 'react-icons/fa';
import { inventoryAPI } from '../services/api';
import { toast } from 'react-toastify';
import DeleteModal from './DeleteModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });

  const categories = ['All', 'Accessories', 'Electronics', 'Furniture', 'Printing', 'Audio', 'Office', 'Storage'];
  const stockOptions = ['All', 'In stock', 'Out of stock'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, categoryFilter, stockFilter]);

  const fetchData = async () => {
    try {
      const [itemsResponse, statsResponse] = await Promise.all([
        inventoryAPI.getAll(),
        inventoryAPI.getStats()
      ]);
      
      setItems(itemsResponse.data || []);
      setFilteredItems(itemsResponse.data || []);
      setStats(statsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.supplier.toLowerCase().includes(term) ||
        item.inventoryId.toLowerCase().includes(term) ||
        item.warehouse.toLowerCase().includes(term)
      );
    }

    // apply category filter
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(item => 
            item.category.toLowerCase() === categoryFilter.toLowerCase()
        );
    }

    // apply stock filter
    if (stockFilter !== 'all') {
        filtered = filtered.filter(item => 
            item.stock.toLowerCase() === stockFilter.toLowerCase()
        );
    }

    setFilteredItems(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
  };

  const handleStockFilter = (stock) => {
    setStockFilter(stock);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const handleDeleteClick = (item) => {
    setDeleteModal({ show: true, item });
  };

const confirmDelete = async () => {
    if (!deleteModal.item || !deleteModal.item._id) {
        console.error('❌ Cannot delete: No item selected');
        toast.error('No item selected for deletion');
        setDeleteModal({ show: false, item: null });
        return;
    }

    try {
        console.log('Deleting item:', deleteModal.item._id);
        
        // make the API call
        const response = await inventoryAPI.delete(deleteModal.item._id);
        
        if (response.success) {
            // update the local state
            setItems(prevItems => prevItems.filter(item => item._id !== deleteModal.item._id));
            toast.success('✅ Item deleted successfully');
            
            // refresh stats
            fetchData();
        } else {
            toast.error(response.message || 'Failed to delete item');
        }
    } catch (error) {
        console.error('❌ Delete error:', error);
        
        // more detailed error handling
        if (error.response) {
            // the request was made and the server responded with a status code
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            
            if (error.response.status === 404) {
                toast.error('Item not found. It may have already been deleted.');
                // refresh the list since item might not exist
                fetchData();
            } else if (error.response.status === 403) {
                toast.error('You are not authorized to delete this item.');
            } else if (error.response.status === 400) {
                toast.error(error.response.data?.message || 'Invalid request');
            } else {
                toast.error(`Server error: ${error.response.data?.message || 'Unknown error'}`);
            }
        } else if (error.request) {
            // the request was made but no response was received
            console.error('No response received:', error.request);
            toast.error('Network error. Please check your connection.');
        } else {
            // something happened in setting up the request
            console.error('Request setup error:', error.message);
            toast.error('Error: ' + error.message);
        }
    } finally {
        // close modal regardless of outcome
        setDeleteModal({ show: false, item: null });
    }
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true 
    };
    return date.toLocaleString('en-US', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Accessories': '#3b82f6',
      'Electronics': '#10b981',
      'Furniture': '#f59e0b',
      'Printing': '#8b5cf6',
      'Audio': '#ec4899',
      'Office': '#06b6d4',
      'Storage': '#f97316'
    };
    return colors[category] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your inventory...</p>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="dashboard">
      {/* header */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-brand">
            <h1 className="logo">
              <FaBox /> Smart Inventory Tracker
            </h1>
            <div className="user-info">
              <span className="username">Welcome, {user.username || 'User'}!</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Log Out
          </button>
        </div>
      </nav>

      <div className="container">
        {/* stats cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">
                <FaBox />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{stats.totalItems}</h3>
                <p className="stat-label">Total Items</p>
              </div>
            </div>
            
            <div className="stat-card in-stock">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{stats.inStockItems}</h3>
                <p className="stat-label">In Stock</p>
              </div>
            </div>
            
            <div className="stat-card out-of-stock">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{stats.outOfStockItems}</h3>
                <p className="stat-label">Out of Stock</p>
              </div>
            </div>
            
            <div className="stat-card value">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{formatCurrency(
                  filteredItems
                    .filter(item => item.stock === 'In stock')
                    .reduce((sum, item) => sum + item.costUnit, 0)
                )}</h3>
                <p className="stat-label">Total Value</p>
              </div>
            </div>
          </div>
        )}

        {/* controls section */}
        <div className="dashboard-controls">
          <div className="search-section">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by product, category, supplier, or ID..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
            
            <div className="filter-section">
              <div className="filter-group">
                <FaFilter className="filter-icon" />
                <select 
                  value={categoryFilter} 
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat.toLowerCase()}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <select 
                  value={stockFilter} 
                  onChange={(e) => handleStockFilter(e.target.value)}
                  className="filter-select"
                >
                  {stockOptions.map(option => (
                    <option key={option} value={option.toLowerCase()}>
                      {option === 'all' ? 'All Stock' : option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <Link to="/create" className="create-btn">
            <FaPlus /> Add New Item
          </Link>
        </div>

        {/* results info */}
        <div className="results-info">
          <p>
            Showing {filteredItems.length} of {items.length} items
            {searchTerm && ` for "${searchTerm}"`}
            {categoryFilter !== 'all' && ` in ${categoryFilter}`}
            {stockFilter !== 'all' && ` (${stockFilter})`}
          </p>
        </div>

        {/* inventory table */}
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Inventory ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Stock</th>
                <th>Cost Unit</th>
                <th>Warehouse</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-items">
                    <div className="empty-state">
                      <FaBox className="empty-icon" />
                      <h3>No inventory items found</h3>
                      <p>
                        {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Start by adding your first inventory item'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td className="inventory-id">
                      <span className="id-badge">{item.inventoryId}</span>
                    </td>
                    <td className="product-name">
                      <strong>{item.productName}</strong>
                    </td>
                    <td>
                      <span 
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(item.category) }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="supplier">{item.supplier}</td>
                    <td>
                      <span className={`stock-badge ${item.stock.toLowerCase().replace(' ', '-')}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="cost-unit">
                      <strong>{formatCurrency(item.costUnit)}</strong>
                    </td>
                    <td className="warehouse">
                      <span className="warehouse-badge">{item.warehouse}</span>
                    </td>
                    <td className="last-updated">
                      {formatDate(item.lastUpdated)}
                    </td>
                    <td className="actions">
                      <Link 
                        to={`/edit/${item._id}`} 
                        className="action-btn edit-btn"
                        title="Edit Item"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="action-btn delete-btn"
                        title="Delete Item"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* delete Confirmation Modal */}
      <DeleteModal
        show={deleteModal.show}
        item={deleteModal.item}
        onClose={() => setDeleteModal({ show: false, item: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Dashboard;