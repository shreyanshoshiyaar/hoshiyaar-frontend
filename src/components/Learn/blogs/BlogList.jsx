import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import SimpleLoading from '../../ui/SimpleLoading';
import NetworkError from '../../ui/NetworkError.jsx';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await authService.getBlogs();
        setBlogs(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch blogs', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading) return <SimpleLoading />;
  if (error) return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-grow text-center text-lg font-black text-blue-900 uppercase tracking-tight mr-10">Blogs & Articles</h1>
      </div>
      <div className="pt-24 px-4 h-full flex items-center justify-center">
        <NetworkError />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-grow text-center text-lg font-black text-blue-900 uppercase tracking-tight mr-10">Blogs & Articles</h1>
      </div>

      <div className="pt-24 px-4 space-y-4">
        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-6xl mb-4">✍️</div>
            <p className="font-bold uppercase tracking-widest text-xs">No blogs yet. Check back soon!</p>
          </div>
        ) : (
          blogs.map((blog) => (
            <div 
              key={blog._id} 
              onClick={() => navigate(`/blogs/${blog._id}`)}
              className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-all"
            >
              {blog.image && (
                <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <div className="flex gap-2 mb-2">
                  {blog.tags?.map(tag => (
                    <span key={tag} className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-black text-blue-900 leading-tight mb-2">{blog.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{blog.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-1">
                    Read More <span className="text-lg">›</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogList;
