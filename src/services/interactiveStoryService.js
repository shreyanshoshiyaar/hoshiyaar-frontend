import api from './apiClient';

const interactiveStoryService = {
  // Admin Methods
  getAllStories: () => {
    return api.get('/api/stories');
  },
  
  createOrUpdateStory: (storyData) => {
    return api.post('/api/stories', storyData);
  },
  
  deleteStory: (id) => {
    return api.delete(`/api/stories/${id}`);
  },

  // Player Methods
  getStoryByBoardAndClass: (boardId, classLevel) => {
    return api.get(`/api/stories/${boardId}/${classLevel}`);
  }
};

export default interactiveStoryService;
