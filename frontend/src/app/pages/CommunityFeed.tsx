import { useState, useEffect } from "react";
import { Smile, Meh, Frown, Heart, MessageSquare, Send, X } from "lucide-react";
import { getPosts, createPost, toggleSupport, Post, getComments, addComment, Comment } from "../services/storage";

export function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [selectedMood, setSelectedMood] = useState<"Positive" | "Neutral" | "Negative">("Neutral");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Load posts from API on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoadingPosts(true);
    setFeedError(null);

    try {
      const loadedPosts = await getPosts();
      setPosts(loadedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      setFeedError("Unable to load community posts right now. Check that the backend is running on localhost:3001.");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleCreatePost = async () => {
    if (newPost.trim()) {
      setFeedError(null);

      try {
        const post = await createPost(newPost, selectedMood);
        setPosts((prev) => [post, ...prev]);
        setNewPost("");
        setSelectedMood("Neutral");
      } catch (error) {
        console.error("Error creating post:", error);
        setFeedError("Unable to publish your post right now. Check that the backend is running and reachable.");
      }
    }
  };

  const handleSupport = async (postId: string) => {
    // Backend equivalent: POST /api/posts/:id/support
    const updatedPost = await toggleSupport(postId);
    if (updatedPost) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    }
  };

  const loadComments = async (postId: string) => {
    if (comments[postId]) return; // Already loaded
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const postComments = await getComments(postId);
      setComments((prev) => ({ ...prev, [postId]: postComments }));
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComments[postId];
    if (!content?.trim()) return;

    try {
      const comment = await addComment(postId, content);
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setNewComments((prev) => ({ ...prev, [postId]: "" }));
      // Update post's comment count
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        )
      );
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const toggleCommentsSection = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
    } else {
      setExpandedComments(postId);
      await loadComments(postId);
    }
  };

  const getMoodIcon = (mood: "Positive" | "Neutral" | "Negative") => {
    switch (mood) {
      case "Positive":
        return <Smile className="w-5 h-5 text-emerald-600" />;
      case "Neutral":
        return <Meh className="w-5 h-5 text-amber-600" />;
      case "Negative":
        return <Frown className="w-5 h-5 text-rose-600" />;
    }
  };

  const getMoodColor = (mood: "Positive" | "Neutral" | "Negative") => {
    switch (mood) {
      case "Positive":
        return "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200";
      case "Neutral":
        return "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200";
      case "Negative":
        return "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200";
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full overflow-x-hidden">
      <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-4 sm:p-6 shadow-md">
        <h2 className="text-base sm:text-lg font-semibold text-purple-900 mb-3 sm:mb-4">Share How You're Feeling</h2>
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMood("Positive")}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                selectedMood === "Positive"
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm"
                  : "border-purple-200 hover:border-emerald-300 bg-white"
              }`}
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Positive</span>
            </button>
            <button
              onClick={() => setSelectedMood("Neutral")}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                selectedMood === "Neutral"
                  ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm"
                  : "border-purple-200 hover:border-amber-300 bg-white"
              }`}
            >
              <Meh className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Neutral</span>
            </button>
            <button
              onClick={() => setSelectedMood("Negative")}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                selectedMood === "Negative"
                  ? "border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 shadow-sm"
                  : "border-purple-200 hover:border-rose-300 bg-white"
              }`}
            >
              <Frown className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm">Struggling</span>
            </button>
          </div>

          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="w-full min-h-[120px] p-3 sm:p-4 border border-purple-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white text-sm sm:text-base"
          />

          <button
            onClick={handleCreatePost}
            disabled={!newPost.trim()}
            className="self-end flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
          >
            <Send className="w-4 h-4" />
            Post
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <h2 className="text-base sm:text-lg font-semibold text-purple-900">Community Posts</h2>
        {feedError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {feedError}
          </div>
        )}
        {isLoadingPosts ? (
          <div className="rounded-xl border border-purple-200 bg-white/70 px-4 py-6 text-sm text-gray-600 shadow-sm">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-purple-200 bg-white/70 px-4 py-6 text-sm text-gray-600 shadow-sm">
            No community posts yet.
          </div>
        ) : posts.map((post) => (
          <div
            key={post.id}
            className={`border rounded-xl p-4 sm:p-6 shadow-md backdrop-blur-sm ${getMoodColor(post.mood)}`}
          >
            <div className="flex items-start gap-2 sm:gap-3 mb-3">
              {getMoodIcon(post.mood)}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-gray-900 text-sm sm:text-base">{post.author}</span>
                <span className="text-xs sm:text-sm text-gray-600">{post.timestamp}</span>
              </div>
            </div>
            <p className="text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base break-words">{post.content}</p>
            <div className="flex items-center gap-3 sm:gap-4 pt-3 border-t border-white/50 flex-wrap">
              <button
                onClick={() => handleSupport(post.id)}
                className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-rose-600 transition-colors"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{post.supportCount} Support</span>
              </button>
              <button
                onClick={() => toggleCommentsSection(post.id)}
                className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{post.commentCount} Comments</span>
              </button>
            </div>

            {/* Comments Section */}
            {expandedComments === post.id && (
              <div className="mt-4 pt-4 border-t border-white/50 space-y-3">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900 text-sm">Comments</h4>
                  <button
                    onClick={() => setExpandedComments(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Comments List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {loadingComments[post.id] ? (
                    <p className="text-xs text-gray-500 text-center py-4">Loading comments...</p>
                  ) : comments[post.id]?.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No comments yet</p>
                  ) : (
                    comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="bg-white/50 rounded-lg p-2 text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-gray-900">{comment.author}</span>
                          <span className="text-gray-500 text-xs">{comment.timestamp}</span>
                        </div>
                        <p className="text-gray-800 break-words">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <div className="flex gap-2 mt-3">
                  <textarea
                    value={newComments[post.id] || ""}
                    onChange={(e) =>
                      setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Add a comment..."
                    className="flex-1 min-w-0 px-2 py-1 border border-purple-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white text-xs"
                    rows={2}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    disabled={!newComments[post.id]?.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}