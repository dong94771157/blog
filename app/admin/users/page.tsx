"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  balance: number;
  createdAt: number;
  purchaseCount: number;
  totalSpent: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(user: AdminUser) {
    if (!confirm(`确定删除用户「${user.username}」吗？其购买记录将保留但无法登录。`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      alert("删除失败");
    }
  }

  function startEdit(user: AdminUser) {
    setEditingId(user.id);
    setEditBalance(String(user.balance));
  }

  async function saveBalance(user: AdminUser) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: Number(editBalance) || 0 }),
      });
      if (res.ok) {
        setEditingId(null);
        await load();
      } else {
        alert("保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  const totalUsers = users.length;
  const totalBalance = users.reduce((s, u) => s + u.balance, 0);
  const totalSpent = users.reduce((s, u) => s + u.totalSpent, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">用户管理</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
          <div className="text-xs text-gray-500 mt-1">注册用户</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-pink-600">¥{totalBalance.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">账户余额总计</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">¥{totalSpent.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">消费总额</div>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">还没有注册用户</p>
          <p className="text-sm mt-2">用户可在前台注册账号购买付费文章</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">邮箱</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">余额</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">购买数</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">消费总额</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">注册时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="w-20 border rounded px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => saveBalance(user)}
                          disabled={saving}
                          className="text-green-600 text-xs hover:text-green-800"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 text-xs hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span className="text-pink-600 font-medium">¥{user.balance.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.purchaseCount}</td>
                  <td className="px-4 py-3 text-green-600">¥{user.totalSpent.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs">
                      <button
                        onClick={() => startEdit(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        充值
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}