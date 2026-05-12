import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';

const BlogManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    image: '',
    tags: '',
    author: 'Hoshiyaar Admin',
    published: true
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await authService.getAllBlogsAdmin();
      setBlogs(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch blogs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = {
        ...form,
        tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (editingBlog) {
        await authService.updateBlog(editingBlog._id, data);
        alert('Blog updated successfully!');
      } else {
        await authService.createBlog(data);
        alert('Blog created successfully!');
      }
      
      setForm({
        title: '',
        content: '',
        excerpt: '',
        image: '',
        tags: '',
        author: 'Hoshiyaar Admin',
        published: true
      });
      setEditingBlog(null);
      fetchBlogs();
    } catch (err) {
      console.error('Failed to save blog', err);
      alert('Error saving blog');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setForm({
      title: blog.title || '',
      content: blog.content || '',
      excerpt: blog.excerpt || '',
      image: blog.image || '',
      tags: (blog.tags || []).join(', '),
      author: blog.author || 'Hoshiyaar Admin',
      published: blog.published !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      setLoading(true);
      await authService.deleteBlog(id);
      alert('Blog deleted successfully!');
      fetchBlogs();
    } catch (err) {
      console.error('Failed to delete blog', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-10 pb-10 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
            <input 
              type="text" 
              name="title"
              value={form.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input 
              type="text" 
              name="author"
              value={form.author}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input 
              type="text" 
              name="tags"
              value={form.tags}
              onChange={handleInputChange}
              placeholder="e.g. Science, Biology, Tips"
              className="w-full px-4 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Feature Image URL</label>
            <input 
              type="text" 
              name="image"
              value={form.image}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Excerpt (shows in list)</label>
            <textarea 
              name="excerpt"
              value={form.excerpt}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-4 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML/Markdown)</label>
            <textarea 
              name="content"
              value={form.content}
              onChange={handleInputChange}
              required
              rows="10"
              className="w-full px-4 py-2 border rounded-md font-mono text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="published"
              checked={form.published}
              onChange={handleInputChange}
              id="published"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">Published</label>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
          >
            {editingBlog ? 'Update Post' : 'Publish Post'}
          </button>
          
          {editingBlog && (
            <button 
              type="button" 
              onClick={() => {
                setEditingBlog(null);
                setForm({
                  title: '',
                  content: '',
                  excerpt: '',
                  image: '',
                  tags: '',
                  author: 'Hoshiyaar Admin',
                  published: true
                });
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 className="text-lg font-bold text-gray-800 mb-4">Existing Blog Posts</h3>
      {loading && blogs.length === 0 ? (
        <p>Loading blogs...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 border-b">Title</th>
                <th className="p-3 border-b">Date</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-50 border-b">
                  <td className="p-3 font-medium">{blog.title}</td>
                  <td className="p-3 text-gray-500">{new Date(blog.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${blog.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {blog.published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(blog)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(blog._id)}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No blogs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BlogManager;
