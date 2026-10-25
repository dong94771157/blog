"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PostEditor from "@/components/PostEditor";
import type { Post } from "@/lib/types";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setPost(data.post);
        } else {
          setError("文章不存在或加载失败");
        }
      })
      .catch(() => setError("网络错误"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  if (error || !post) {
    return (
      <div className="text-center py-20 text-red-500">{error || "文章不存在"}</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑文章</h1>
      <PostEditor post={post} />
    </div>
  );
}