import PostEditor from "@/components/PostEditor";

export const metadata = {
  title: "新建文章",
};

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">新建文章</h1>
      <PostEditor />
    </div>
  );
}