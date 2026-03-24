// Storage service for community posts (Supabase direct)

import { supabase } from "../../lib/supabase";

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
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return ((data ?? []) as any[]).map(normalizePost);
};

export const createPost = async (content: string, mood: Post["mood"]): Promise<Post> => {
  const userId = getUserId();

  const { data, error } = await supabase
    .from("posts")
    .insert([{ content, mood, author: "Anonymous User", user_id: userId }])
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return normalizePost(data);
};

export const toggleSupport = async (postId: string): Promise<Post | null> => {
  const userId = getUserId();

  // Check if user already supported this post
  const { data: existing, error: checkError } = await supabase
    .from("post_supports")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Supabase error: ${checkError.message}`);
  }

  if (existing) {
    // Remove support
    const { error: deleteError } = await supabase
      .from("post_supports")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (deleteError) {
      throw new Error(`Supabase error: ${deleteError.message}`);
    }
  } else {
    // Add support
    const { error: insertError } = await supabase
      .from("post_supports")
      .insert([{ post_id: postId, user_id: userId }]);
    if (insertError) {
      throw new Error(`Supabase error: ${insertError.message}`);
    }
  }

  // Fetch the updated post
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error || !data) return null;

  return normalizePost(data);
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return (data ?? []).map((c: any) => ({
    id: c.id,
    postId: c.post_id,
    author: c.author ?? "Anonymous User",
    content: c.content,
    timestamp: c.created_at ? new Date(c.created_at).toLocaleString() : c.timestamp,
    createdAt: c.created_at ? new Date(c.created_at).getTime() : c.createdAt ?? Date.now(),
  }));
};

export const addComment = async (postId: string, content: string): Promise<Comment> => {
  const userId = getUserId();

  const { data, error } = await supabase
    .from("post_comments")
    .insert([{ post_id: postId, content, author: "Anonymous User", user_id: userId }])
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return {
    id: data.id,
    postId,
    author: data.author ?? "Anonymous User",
    content: data.content,
    timestamp: data.created_at ? new Date(data.created_at).toLocaleString() : new Date().toLocaleString(),
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
  };
};
