import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import SimpleLoading from '../../ui/SimpleLoading';
import NetworkError from '../../ui/NetworkError.jsx';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

      <div className="pt-24 px-4 mb-6">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search blogs & articles..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-gray-700 shadow-sm"
          />
        </div>
      </div>

      <div className="px-4 max-w-7xl mx-auto">
        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-6xl mb-4">✍️</div>
            <p className="font-bold uppercase tracking-widest text-xs">No blogs yet. Check back soon!</p>
          </div>
        ) : (
          (() => {
            const filteredBlogs = blogs.filter(blog => 
              blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
              blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              blog.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            if (filteredBlogs.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="font-bold uppercase tracking-widest text-xs">No blogs found for "{searchQuery}"</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map((blog) => (
                  <div 
                    key={blog._id} 
                    onClick={() => {
                      const category = blog.category || 'general';
                      const slugOrId = blog.slug || blog._id;
                      navigate(`/blogs/${category}/${slugOrId}`);
                    }}
                    className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md hover:border-blue-100 flex flex-col h-full"
                  >
                    {blog.image && (
                      <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {blog.tags?.map(tag => (
                          <span key={tag} className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-xl font-black text-blue-900 leading-tight mb-2">{blog.title}</h2>
                      <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-grow">{blog.excerpt}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-1">
                          Read More <span className="text-lg">›</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default BlogList;
