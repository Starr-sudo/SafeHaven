// Storage service for community posts (API-only)

export interface Post {
  id: string;
  author: string;
  content: string;
  mood: "Positive" | "Neutral" | "Negative";
  timestamp: string;
  supportCount: number;
  commentCount: number;
  supportedBy: string[];
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  timestamp: string;
  createdAt: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let anonymousUserId = "";

export const getUserId = (): string => {
  if (!anonymousUserId) {
    anonymousUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return anonymousUserId;
};

const normalizePost = (post: any): Post => ({
  id: post.id,
  author: post.author ?? "Anonymous User",
  content: post.content,
  mood: post.mood,
  timestamp: post.created_at ? new Date(post.created_at).toLocaleString() : post.timestamp,
  supportCount: post.support_count ?? post.supportCount ?? 0,
  commentCount: post.comment_count ?? post.commentCount ?? 0,
  supportedBy: post.supported_by ?? post.supportedBy ?? [],
  createdAt: post.created_at ? new Date(post.created_at).getTime() : post.createdAt ?? Date.now(),
});

export const getPosts = async (): Promise<Post[]> => {
  const response = await fetch(`${API_URL}/api/posts`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const json = await response.json();
  return ((json.posts ?? []) as any[])
    .map(normalizePost)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const createPost = async (content: string, mood: Post["mood"]): Promise<Post> => {
  const userId = getUserId();
  const response = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-anonymous-user-id": userId,
    },
    body: JSON.stringify({ content, mood }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const json = await response.json();
  return normalizePost(json.post ?? json);
};

export const toggleSupport = async (postId: string): Promise<Post | null> => {
  const userId = getUserId();

  const response = await fetch(`${API_URL}/api/posts/${postId}/support`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-anonymous-user-id": userId,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const json = await response.json();
  const posts = await getPosts();
  const postIndex = posts.findIndex((p) => p.id === postId);
  if (postIndex === -1) return null;

  const updatedPost = { ...posts[postIndex], supportCount: json.support_count };
  return updatedPost;
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const userId = getUserId();
  const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
    headers: {
      "x-anonymous-user-id": userId,
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const json = await response.json();
  return (json.comments ?? []).map((c: any) => ({
    id: c.id,
    postId: c.post_id,
    author: c.author ?? "Anonymous User",
    content: c.content,
    timestamp: c.created_at ? new Date(c.created_at).toLocaleString() : c.timestamp,
    createdAt: c.created_at ? new Date(c.created_at).getTime() : c.createdAt ?? Date.now(),
  })).sort((a: Comment, b: Comment) => a.createdAt - b.createdAt);
};

export const addComment = async (postId: string, content: string): Promise<Comment> => {
  const userId = getUserId();
  const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-anonymous-user-id": userId,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const json = await response.json();
  const comment = json.comment ?? json;

  return {
    id: comment.id,
    postId,
    author: comment.author ?? "Anonymous User",
    content: comment.content,
    timestamp: comment.created_at ? new Date(comment.created_at).toLocaleString() : new Date().toLocaleString(),
    createdAt: comment.created_at ? new Date(comment.created_at).getTime() : Date.now(),
  };
};
