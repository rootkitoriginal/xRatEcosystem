import { useState, useEffect } from 'react';
import './DataForm.css';

function DataForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Development',
    status: 'Active',
    priority: 'Medium',
    value: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Development',
        status: initialData.status || 'Active',
        priority: initialData.priority || 'Medium',
        value: initialData.value || '',
      });
    }
  }, [initialData]);

  const categories = ['Development', 'Marketing', 'Operations', 'Support', 'Security', 'Documentation'];
  const statuses = ['Active', 'Pending', 'Completed'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!formData.value) {
      newErrors.value = 'Value is required';
    } else if (isNaN(formData.value) || Number(formData.value) < 0) {
      newErrors.value = 'Value must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        value: Number(formData.value),
      };

      await onSubmit(submitData);

      // Reset form if it's a create operation
      if (!initialData) {
        setFormData({
          name: '',
          category: 'Development',
          status: 'Active',
          priority: 'Medium',
          value: '',
        });
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save data' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="data-form-container">
      <h3>{initialData ? '✏️ Edit Record' : '➕ New Record'}</h3>
      <form onSubmit={handleSubmit} className="data-form">
        <div className="form-group">
          <label htmlFor="name">
            Name <span className="required">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter name"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {statuses.map((stat) => (
                <option key={stat} value={stat}>
                  {stat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {priorities.map((pri) => (
                <option key={pri} value={pri}>
                  {pri}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="value">
              Value <span className="required">*</span>
            </label>
            <input
              id="value"
              name="value"
              type="number"
              value={formData.value}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              disabled={isSubmitting}
              aria-invalid={!!errors.value}
            />
            {errors.value && <span className="error-message">{errors.value}</span>}
          </div>
        </div>

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '⏳ Saving...' : initialData ? '💾 Update' : '➕ Create'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
              ❌ Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default DataForm;
