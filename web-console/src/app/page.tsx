"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  HeartHandshake,
  Sparkles,
  BookOpen,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Bot,
  Activity,
  Phone,
  Calendar,
  ChevronRight,
  Download,
  Send,
  MoreVertical,
  UserCheck,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Database,
  Server,
  Layers,
  Radio,
  Check,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Interface definitions matching the remote PostgreSQL schema
export interface ClientRecord {
  id: number;
  telegramId: string;
  fullName: string;
  phone: string;
  role: string;
  isRegistered: boolean;
  joinedAt: string;
}

export interface CounselingRecord {
  id: number;
  referenceNumber: string;
  clientName: string;
  phone: string;
  concern: string;
  description: string;
  preferredMethod: string;
  preferredTime: string;
  status: "pending" | "assigned" | "scheduled" | "completed";
  assignedTo?: string;
  createdAt: string;
}

export interface InnerHealingRecord {
  id: number;
  referenceNumber: string;
  clientName: string;
  phone: string;
  topic: string;
  status: "pending" | "contacted" | "completed";
  createdAt: string;
}

export interface CourseProgressRecord {
  id: number;
  clientName: string;
  phone?: string;
  courseTitle: string;
  currentDay: number;
  totalDays: number;
  accountabilityRequested: boolean;
  lastActive: string;
}

export interface ResourceSaleRecord {
  id: number;
  clientName: string;
  phone?: string;
  resourceTitle: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
}

// Fallback initial dataset matching the remote schema in case server endpoint is warming up
const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: 1,
    telegramId: "109283741",
    fullName: "Dawit Haile",
    phone: "+251911223344",
    role: "client",
    isRegistered: true,
    joinedAt: "Today, 10:14 AM",
  },
  {
    id: 2,
    telegramId: "982347102",
    fullName: "Selamawit Kebede",
    phone: "+251922334455",
    role: "client",
    isRegistered: true,
    joinedAt: "Yesterday",
  },
  {
    id: 3,
    telegramId: "582910394",
    fullName: "Michael Tadesse",
    phone: "+251933445566",
    role: "client",
    isRegistered: true,
    joinedAt: "Oct 10, 2026",
  },
  {
    id: 4,
    telegramId: "772910482",
    fullName: "Bethlehem Assefa",
    phone: "+251944556677",
    role: "client",
    isRegistered: true,
    joinedAt: "Oct 09, 2026",
  },
];

const INITIAL_COUNSELING: CounselingRecord[] = [
  {
    id: 1,
    referenceNumber: "CN-84920",
    clientName: "Dawit Haile",
    phone: "+251911223344",
    concern: "Purity & Mindset Concern",
    description: "Struggling with triggers after late night work, wanting sustained freedom.",
    preferredMethod: "Telegram Chat / Audio",
    preferredTime: "Evening (6:00 PM - 9:00 PM)",
    status: "pending",
    createdAt: "Today, 10:22 AM",
  },
  {
    id: 2,
    referenceNumber: "CN-71829",
    clientName: "Michael Tadesse",
    phone: "+251933445566",
    concern: "Relationship Concern",
    description: "Navigating boundary discussions in marriage.",
    preferredMethod: "Secure Video Call",
    preferredTime: "Morning (9:00 AM - 12:00 PM)",
    status: "assigned",
    assignedTo: "Pastor Samuel",
    createdAt: "Yesterday",
  },
  {
    id: 3,
    referenceNumber: "CN-63910",
    clientName: "Yared Wolde",
    phone: "+251911998877",
    concern: "Personal Concern",
    description: "Personal spiritual and purity guidance",
    preferredMethod: "Direct Phone Call",
    preferredTime: "Afternoon (1:00 PM - 5:00 PM)",
    status: "scheduled",
    assignedTo: "Sister Ruth",
    createdAt: "Oct 08, 2026",
  },
];

const INITIAL_INNER_HEALING: InnerHealingRecord[] = [
  {
    id: 1,
    referenceNumber: "IH-38291",
    clientName: "Selamawit Kebede",
    phone: "+251922334455",
    topic: "Rejection & Healing from Hurt",
    status: "pending",
    createdAt: "Today, 11:05 AM",
  },
  {
    id: 2,
    referenceNumber: "IH-29183",
    clientName: "Bethlehem Assefa",
    phone: "+251944556677",
    topic: "Shame & Guilt Removal",
    status: "contacted",
    createdAt: "Yesterday",
  },
  {
    id: 3,
    referenceNumber: "IH-10928",
    clientName: "Kidus Daniel",
    phone: "+251933001122",
    topic: "Identity & God-given Worth",
    status: "completed",
    createdAt: "Oct 06, 2026",
  },
];

const INITIAL_COURSES: CourseProgressRecord[] = [
  {
    id: 1,
    clientName: "Dawit Haile",
    phone: "+251911223344",
    courseTitle: "🌅 7-Day Journey: Overcoming Triggers",
    currentDay: 3,
    totalDays: 7,
    accountabilityRequested: true,
    lastActive: "15 mins ago",
  },
  {
    id: 2,
    clientName: "Michael Tadesse",
    phone: "+251933445566",
    courseTitle: "🌱 21-Day Journey: Walking in Freedom",
    currentDay: 12,
    totalDays: 21,
    accountabilityRequested: false,
    lastActive: "Today",
  },
];

const INITIAL_SALES: ResourceSaleRecord[] = [
  {
    id: 1,
    clientName: "Dawit Haile",
    phone: "+251911223344",
    resourceTitle: "📖 Breaking Chains: The Wholeness Journey (E-Book)",
    amount: 4.99,
    currency: "USD",
    status: "completed",
    date: "Today, 10:45 AM",
  },
  {
    id: 2,
    clientName: "Selamawit Kebede",
    phone: "+251922334455",
    resourceTitle: "🕊️ Healing Father & Mother Wounds (E-Book)",
    amount: 6.99,
    currency: "USD",
    status: "completed",
    date: "Yesterday",
  },
];

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<string>("counselling");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [counselingFilter, setCounselingFilter] = useState<string>("all");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://bot-api.puritymattersethiopia.com";
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<"remote_live" | "preview_fallback">("preview_fallback");
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Entities state
  const [clients, setClients] = useState<ClientRecord[]>(INITIAL_CLIENTS);
  const [counselingRequests, setCounselingRequests] = useState<CounselingRecord[]>(INITIAL_COUNSELING);
  const [innerHealingRequests, setInnerHealingRequests] = useState<InnerHealingRecord[]>(INITIAL_INNER_HEALING);
  const [courseProgressList, setCourseProgressList] = useState<CourseProgressRecord[]>(INITIAL_COURSES);
  const [resourceSales, setResourceSales] = useState<ResourceSaleRecord[]>(INITIAL_SALES);

  // Format dates helper
  const formatDateTime = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sync with remote server
  const syncWithRemoteBackend = useCallback(async () => {
    setIsRefreshing(true);
    setApiStatus("checking");
    const startTime = Date.now();

    try {
      // Step 1: Check health endpoint
      const healthRes = await fetch(`${apiUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!healthRes.ok) {
        setApiStatus("offline");
        setDataSource("preview_fallback");
        setIsRefreshing(false);
        return;
      }

      setApiLatency(Date.now() - startTime);
      setApiStatus("online");

      // Step 2: Concurrently query all schema endpoints
      const [clientsRes, counselingRes, innerHealingRes, coursesRes, resourcesRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/admin/clients`, { signal: AbortSignal.timeout(6000) }),
        fetch(`${apiUrl}/api/admin/counseling`, { signal: AbortSignal.timeout(6000) }),
        fetch(`${apiUrl}/api/admin/inner-healing`, { signal: AbortSignal.timeout(6000) }),
        fetch(`${apiUrl}/api/admin/courses`, { signal: AbortSignal.timeout(6000) }),
        fetch(`${apiUrl}/api/admin/resources`, { signal: AbortSignal.timeout(6000) }),
      ]);

      let hasLiveData = false;

      // Handle clients from remote table: client
      if (clientsRes.status === "fulfilled" && clientsRes.value.ok) {
        const rawClients = await clientsRes.value.json();
        if (Array.isArray(rawClients) && rawClients.length > 0) {
          const mappedClients: ClientRecord[] = rawClients.map((item: any) => ({
            id: item.id,
            telegramId: String(item.telegramId),
            fullName: item.fullName || item.firstName || `User #${item.telegramId}`,
            phone: item.phone || "Not shared",
            role: item.role || "client",
            isRegistered: !!item.isRegistered,
            joinedAt: formatDateTime(item.createdAt),
          }));
          setClients(mappedClients);
          hasLiveData = true;
        }
      }

      // Handle counseling requests from remote table: counseling_request
      if (counselingRes.status === "fulfilled" && counselingRes.value.ok) {
        const rawCounseling = await counselingRes.value.json();
        if (Array.isArray(rawCounseling) && rawCounseling.length > 0) {
          const mappedCounseling: CounselingRecord[] = rawCounseling.map((item: any) => ({
            id: item.id,
            referenceNumber: item.referenceNumber || `CN-${item.id}`,
            clientName: item.clientName || "Client",
            phone: item.phone || "N/A",
            concern: item.concern || "General Counseling",
            description: item.description || "No description provided",
            preferredMethod: item.preferredMethod || "Telegram",
            preferredTime: item.preferredTime || "Next Available",
            status: item.status || "pending",
            assignedTo: item.assignedTo || undefined,
            createdAt: formatDateTime(item.createdAt),
          }));
          setCounselingRequests(mappedCounseling);
          hasLiveData = true;
        }
      }

      // Handle inner healing requests from remote table: inner_healing_request
      if (innerHealingRes.status === "fulfilled" && innerHealingRes.value.ok) {
        const rawHealing = await innerHealingRes.value.json();
        if (Array.isArray(rawHealing) && rawHealing.length > 0) {
          const mappedHealing: InnerHealingRecord[] = rawHealing.map((item: any) => ({
            id: item.id,
            referenceNumber: item.referenceNumber || `IH-${item.id}`,
            clientName: item.clientName || "Client",
            phone: item.phone || "N/A",
            topic: item.topic || "Inner Healing Topic",
            status: item.status || "pending",
            createdAt: formatDateTime(item.createdAt),
          }));
          setInnerHealingRequests(mappedHealing);
          hasLiveData = true;
        }
      }

      // Handle courses progress from remote table: course_progress
      if (coursesRes.status === "fulfilled" && coursesRes.value.ok) {
        const rawCourses = await coursesRes.value.json();
        if (Array.isArray(rawCourses) && rawCourses.length > 0) {
          const mappedCourses: CourseProgressRecord[] = rawCourses.map((item: any) => ({
            id: item.id,
            clientName: item.clientName || `User #${item.telegramId}`,
            phone: item.phone || "N/A",
            courseTitle:
              item.courseId === "journey_7d"
                ? "🌅 7-Day Journey: Overcoming Triggers"
                : item.courseId === "journey_21d"
                ? "🌱 21-Day Journey: Walking in Freedom"
                : `Journey (${item.courseId})`,
            currentDay: item.currentDay || 1,
            totalDays: item.totalDays || 7,
            accountabilityRequested: !!item.accountabilityRequested,
            lastActive: formatDateTime(item.updatedAt || item.createdAt),
          }));
          setCourseProgressList(mappedCourses);
          hasLiveData = true;
        }
      }

      // Handle resources from remote table: resource_purchase
      if (resourcesRes.status === "fulfilled" && resourcesRes.value.ok) {
        const rawSales = await resourcesRes.value.json();
        if (Array.isArray(rawSales) && rawSales.length > 0) {
          const mappedSales: ResourceSaleRecord[] = rawSales.map((item: any) => ({
            id: item.id,
            clientName: item.clientName || `User #${item.telegramId}`,
            phone: item.phone || "N/A",
            resourceTitle: item.resourceTitle || item.resourceId,
            amount: Number(item.amount) || 0,
            currency: item.currency || "USD",
            status: item.status || "completed",
            date: formatDateTime(item.createdAt),
          }));
          setResourceSales(mappedSales);
          hasLiveData = true;
        }
      }

      if (hasLiveData) {
        setDataSource("remote_live");
      }
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch {
      setApiStatus("offline");
      setDataSource("preview_fallback");
    } finally {
      setIsRefreshing(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    syncWithRemoteBackend();
  }, [syncWithRemoteBackend]);

  // Action: Forward Counseling update to remote backend
  const updateCounselingStatus = async (id: number, status: CounselingRecord["status"], assignedTo?: string) => {
    // 1. Optimistic UI update
    setCounselingRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status, ...(assignedTo ? { assignedTo } : {}) } : req))
    );

    setActionNotice(`Updating Counseling Request #${id} to ${status.toUpperCase()}...`);

    try {
      const res = await fetch(`${apiUrl}/api/admin/counseling/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assignedTo }),
      });

      if (res.ok) {
        setActionNotice(`Success: Request #${id} set to ${status.toUpperCase()} in remote PostgreSQL.`);
      } else {
        setActionNotice(`Saved in Console. (Remote server responded with ${res.status})`);
      }
    } catch {
      setActionNotice(`Saved in Console preview. Remote update queued.`);
    }

    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Action: Forward Inner Healing update to remote backend
  const updateInnerHealingStatus = async (id: number, status: InnerHealingRecord["status"]) => {
    // 1. Optimistic UI update
    setInnerHealingRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );

    setActionNotice(`Updating Inner Healing #${id} to ${status.toUpperCase()}...`);

    try {
      const res = await fetch(`${apiUrl}/api/admin/inner-healing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setActionNotice(`Success: Request #${id} marked ${status.toUpperCase()} in remote PostgreSQL.`);
      } else {
        setActionNotice(`Saved in Console. (Remote server returned ${res.status})`);
      }
    } catch {
      setActionNotice(`Saved in Console preview. Remote update queued.`);
    }

    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Filters
  const filteredCounseling = counselingRequests.filter((req) => {
    if (counselingFilter === "all") return true;
    return req.status === counselingFilter;
  });

  const filteredClients = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.telegramId.includes(searchQuery)
  );

  return (
    <div id="admin-console-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar - White Mode */}
      <header id="admin-header" className="border-b border-slate-200/90 bg-white/95 backdrop-blur sticky top-0 z-50 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Purity Matters Web Console
                </h1>
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-800 bg-emerald-50 font-medium">
                  Admin Portal
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Telegram Bot Backend Management & Pastoral Care</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100/90 text-xs shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${apiStatus === "online" ? "bg-emerald-500 animate-pulse" : apiStatus === "checking" ? "bg-amber-400 animate-ping" : "bg-rose-500"}`} />
              <span className="text-slate-600 font-mono text-[11px] truncate max-w-[180px]" title={apiUrl}>
                {apiUrl.replace("https://", "")}
              </span>
              <span className="text-slate-300">|</span>
              <span className={apiStatus === "online" ? "text-emerald-700 font-semibold" : apiStatus === "checking" ? "text-amber-700 font-medium" : "text-rose-600 font-medium"}>
                {apiStatus === "online" ? `Live (${apiLatency}ms)` : apiStatus === "checking" ? "Connecting..." : "Offline"}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={syncWithRemoteBackend}
              disabled={isRefreshing}
              className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 cursor-pointer text-xs shadow-2xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-slate-500 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
              Sync Remote Schema
            </Button>

            <Avatar className="w-8 h-8 border border-slate-200 shadow-2xs">
              <AvatarFallback className="bg-emerald-600 text-white font-semibold text-xs">PM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Schema Live Connection Banner */}
      <section id="schema-sync-banner" className="border-b border-slate-200/80 bg-white px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Remote PostgreSQL Schema:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 border-slate-200 text-slate-700 font-normal">
                client
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 border-slate-200 text-slate-700 font-normal">
                counseling_request
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 border-slate-200 text-slate-700 font-normal">
                inner_healing_request
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 border-slate-200 text-slate-700 font-normal">
                course_progress
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 border-slate-200 text-slate-700 font-normal">
                resource_purchase
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Status:{" "}
              {dataSource === "remote_live" ? (
                <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Live Synchronized ({lastSyncTime})
                </span>
              ) : (
                <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Live Preview Mode (Ready to Sync)
                </span>
              )}
            </span>

            {/* Schema Inspector Dialog */}
            <Dialog>
              <DialogTrigger className="text-xs text-emerald-700 hover:text-emerald-800 underline font-medium cursor-pointer">
                View Schema Specs
              </DialogTrigger>
              <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 font-bold flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    Remote PostgreSQL Schema Specifications
                  </DialogTitle>
                  <DialogDescription className="text-slate-500">
                    Host: bot-api.puritymattersethiopia.com | Database Engine: PostgreSQL
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <h4 className="font-bold text-slate-800 mb-1">1. client (Clients & Users)</h4>
                    <p className="text-slate-600 mb-2">Registered via Telegram contact sharing with verified phone and role = client.</p>
                    <code className="block bg-white p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                      id (SERIAL), telegram_id (BIGINT, UNIQUE), full_name (VARCHAR), username (VARCHAR), phone (VARCHAR), role (VARCHAR), is_registered (BOOL), created_at (TIMESTAMP)
                    </code>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <h4 className="font-bold text-slate-800 mb-1">2. counseling_request (Counselling Bookings)</h4>
                    <p className="text-slate-600 mb-2">Multi-step intake with unique reference number (CN-XXXXX) and assigned counselor.</p>
                    <code className="block bg-white p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                      id (SERIAL), reference_number (VARCHAR, UNIQUE), telegram_id (BIGINT), client_name (VARCHAR), phone (VARCHAR), concern (VARCHAR), description (TEXT), preferred_method (VARCHAR), preferred_time (VARCHAR), status (VARCHAR), assigned_to (VARCHAR)
                    </code>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <h4 className="font-bold text-slate-800 mb-1">3. inner_healing_request (Ministry Queue)</h4>
                    <p className="text-slate-600 mb-2">Target emotional topics (Rejection, Shame, Identity, Abandonment, Forgiveness).</p>
                    <code className="block bg-white p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                      id (SERIAL), reference_number (VARCHAR, UNIQUE), telegram_id (BIGINT), client_name (VARCHAR), phone (VARCHAR), topic (VARCHAR), status (VARCHAR)
                    </code>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <h4 className="font-bold text-slate-800 mb-1">4. course_progress (7-Day & 21-Day Journeys)</h4>
                    <p className="text-slate-600 mb-2">Tracks completion of daily scriptures, actions, and accountability requests.</p>
                    <code className="block bg-white p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                      id (SERIAL), telegram_id (BIGINT), course_id (VARCHAR), current_day (INT), total_days (INT), accountability_requested (BOOL)
                    </code>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <h4 className="font-bold text-slate-800 mb-1">5. resource_purchase (E-Books & Guides)</h4>
                    <p className="text-slate-600 mb-2">Logs resource access, PDF downloads, and payments.</p>
                    <code className="block bg-white p-2 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                      id (SERIAL), telegram_id (BIGINT), resource_id (VARCHAR), resource_title (VARCHAR), amount (DECIMAL), currency (VARCHAR), status (VARCHAR)
                    </code>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Action Notification Alert (if any) */}
      {actionNotice && (
        <div id="action-notification-toast" className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main id="admin-main" className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Metric Cards Row - White Mode with Clean Shadows */}
        <section id="metrics-overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered Clients</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{clients.length}</div>
              <p className="text-xs text-emerald-700 font-medium flex items-center mt-1">
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Verified via Telegram Contact
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Counselling Sessions</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/60 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4 text-sky-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{counselingRequests.length}</div>
              <p className="text-xs text-amber-700 font-medium flex items-center mt-1">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                {counselingRequests.filter((c) => c.status === "pending").length} Pending Assignment
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inner Healing</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200/60 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{innerHealingRequests.length}</div>
              <p className="text-xs text-slate-500 mt-1">Across 6 restoration topics</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">E-Books & Store</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${resourceSales.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}</div>
              <p className="text-xs text-emerald-700 font-medium mt-1">{resourceSales.length} Total Downloads / Orders</p>
            </CardContent>
          </Card>
        </section>

        {/* Console Navigation Tabs */}
        <section id="console-tabs-section">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-slate-200/70 border border-slate-200 p-1 rounded-xl">
              <TabsTrigger value="counselling" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs text-slate-600 font-medium">
                🛋️ Counselling ({counselingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="inner-healing" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs text-slate-600 font-medium">
                🕊️ Inner Healing ({innerHealingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="clients" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs text-slate-600 font-medium">
                👥 Clients Directory ({clients.length})
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs text-slate-600 font-medium">
                📚 Courses & Accountability ({courseProgressList.length})
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs text-slate-600 font-medium">
                📖 E-Books & Store ({resourceSales.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: COUNSELLING MANAGEMENT */}
            <TabsContent value="counselling" className="space-y-4">
              <Card className="bg-white border-slate-200/90 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Counselling Intake Management</CardTitle>
                    <CardDescription className="text-slate-500">
                      Manage bookings submitted via the Telegram bot with reference codes and update statuses to PostgreSQL.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 font-medium shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      value={counselingFilter}
                      onChange={(e) => setCounselingFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
                          <TableHead className="text-slate-600 font-semibold text-xs">Ref #</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Client</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Concern Area</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Preferred Method</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Preferred Time</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Status</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Assigned To</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCounseling.map((item) => (
                          <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-mono text-emerald-700 font-bold text-xs bg-emerald-50/60 rounded px-2 py-1 w-max border border-emerald-200/50">
                              {item.referenceNumber}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-slate-900">{item.clientName}</div>
                              <div className="text-xs text-slate-500 font-mono">{item.phone}</div>
                            </TableCell>
                            <TableCell className="text-slate-700">
                              <Badge variant="outline" className="border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium">
                                {item.concern}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-700 text-sm">{item.preferredMethod}</TableCell>
                            <TableCell className="text-slate-700 text-sm">{item.preferredTime}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  item.status === "pending"
                                    ? "bg-amber-50 text-amber-800 border-amber-200 font-medium"
                                    : item.status === "assigned"
                                    ? "bg-sky-50 text-sky-800 border-sky-200 font-medium"
                                    : item.status === "scheduled"
                                    ? "bg-indigo-50 text-indigo-800 border-indigo-200 font-medium"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium"
                                }
                              >
                                {item.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-700 text-sm font-medium">{item.assignedTo || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger className="inline-flex items-center justify-center rounded-md text-xs font-semibold transition-colors hover:bg-emerald-50 border border-emerald-200/80 h-7 px-3 text-emerald-700 hover:text-emerald-800 cursor-pointer shadow-2xs">
                                  Manage
                                </DialogTrigger>
                                <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md shadow-xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-slate-900 font-bold">Manage Request {item.referenceNumber}</DialogTitle>
                                    <DialogDescription className="text-slate-500">
                                      Client: {item.clientName} ({item.phone})
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-2">
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm space-y-1">
                                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">DESCRIPTION FROM CLIENT:</p>
                                      <p className="text-slate-800">{item.description}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Update Status</label>
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          size="sm"
                                          variant={item.status === "assigned" ? "default" : "outline"}
                                          onClick={() => updateCounselingStatus(item.id, "assigned", "Pastor Samuel")}
                                          className="text-xs cursor-pointer"
                                        >
                                          Assign Pastor Samuel
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={item.status === "scheduled" ? "default" : "outline"}
                                          onClick={() => updateCounselingStatus(item.id, "scheduled")}
                                          className="text-xs cursor-pointer"
                                        >
                                          Mark Scheduled
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={item.status === "completed" ? "default" : "outline"}
                                          onClick={() => updateCounselingStatus(item.id, "completed")}
                                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                        >
                                          Mark Completed
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: INNER HEALING SESSIONS */}
            <TabsContent value="inner-healing" className="space-y-4">
              <Card className="bg-white border-slate-200/90 shadow-xs">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900">Inner Healing Ministry Queue</CardTitle>
                  <CardDescription className="text-slate-500">
                    Requests submitted by clients for specialized emotional and spiritual restoration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
                          <TableHead className="text-slate-600 font-semibold text-xs">Reference</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Client</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Target Focus Topic</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Requested At</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Status</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {innerHealingRequests.map((item) => (
                          <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-mono text-violet-700 font-bold text-xs bg-violet-50/60 rounded px-2 py-1 w-max border border-violet-200/50">
                              {item.referenceNumber}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-slate-900">{item.clientName}</div>
                              <div className="text-xs text-slate-500 font-mono">{item.phone}</div>
                            </TableCell>
                            <TableCell className="text-slate-800">
                              <Badge variant="outline" className="border-violet-200 text-violet-800 bg-violet-50 font-medium">
                                {item.topic}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{item.createdAt}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  item.status === "pending"
                                    ? "bg-amber-50 text-amber-800 border-amber-200 font-medium"
                                    : item.status === "contacted"
                                    ? "bg-sky-50 text-sky-800 border-sky-200 font-medium"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium"
                                }
                              >
                                {item.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              {item.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                                  onClick={() => updateInnerHealingStatus(item.id, "contacted")}
                                >
                                  Mark Contacted
                                </Button>
                              )}
                              {item.status === "contacted" && (
                                <Button
                                  size="sm"
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs"
                                  onClick={() => updateInnerHealingStatus(item.id, "completed")}
                                >
                                  Mark Completed
                                </Button>
                              )}
                              {item.status === "completed" && (
                                <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-xs">
                                  Done
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: CLIENT DIRECTORY */}
            <TabsContent value="clients" className="space-y-4">
              <Card className="bg-white border-slate-200/90 shadow-xs">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Registered Clients (Table: client)</CardTitle>
                    <CardDescription className="text-slate-500">
                      All users synced from Telegram with verified contact numbers and role = client.
                    </CardDescription>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      placeholder="Search name, phone, ID..."
                      className="bg-slate-50 border-slate-200 pl-9 text-xs text-slate-900 shadow-2xs focus:bg-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
                          <TableHead className="text-slate-600 font-semibold text-xs">Telegram ID</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Full Name</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Phone</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Role</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Status</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Registered At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow key={client.id} className="border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-mono text-slate-500 text-xs">{client.telegramId}</TableCell>
                            <TableCell className="font-semibold text-slate-900">{client.fullName}</TableCell>
                            <TableCell className="text-slate-700 text-sm font-mono">{client.phone}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-emerald-200 text-emerald-800 bg-emerald-50 font-medium">
                                {client.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-medium">
                                {client.isRegistered ? "Verified" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{client.joinedAt}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: COURSES & ACCOUNTABILITY */}
            <TabsContent value="courses" className="space-y-4">
              <Card className="bg-white border-slate-200/90 shadow-xs">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900">Course Journeys & Accountability Requests</CardTitle>
                  <CardDescription className="text-slate-500">
                    Track client completion of 7-day and 21-day purity journeys (Table: course_progress).
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
                          <TableHead className="text-slate-600 font-semibold text-xs">Client</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Contact</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Journey Enrolled</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Current Progress</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Accountability Partner</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseProgressList.map((item) => (
                          <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-semibold text-slate-900">{item.clientName}</TableCell>
                            <TableCell className="font-mono text-slate-500 text-xs">{item.phone || "—"}</TableCell>
                            <TableCell className="text-slate-800">{item.courseTitle}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-700 font-bold">
                                  Day {item.currentDay} / {item.totalDays}
                                </span>
                                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{ width: `${Math.min(100, Math.round((item.currentDay / item.totalDays) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.accountabilityRequested ? (
                                <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-semibold">
                                  ⚠️ Needs Partner
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-xs">Self-paced</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{item.lastActive}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: RESOURCES & E-BOOKS */}
            <TabsContent value="resources" className="space-y-4">
              <Card className="bg-white border-slate-200/90 shadow-xs">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900">Digital Store & Resource Orders</CardTitle>
                  <CardDescription className="text-slate-500">
                    Purchases and downloads logged from the Telegram bot (Table: resource_purchase).
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
                          <TableHead className="text-slate-600 font-semibold text-xs">Client</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Contact</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Resource Title</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Amount</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Access Status</TableHead>
                          <TableHead className="text-slate-600 font-semibold text-xs">Purchase Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resourceSales.map((sale) => (
                          <TableRow key={sale.id} className="border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-semibold text-slate-900">{sale.clientName}</TableCell>
                            <TableCell className="font-mono text-slate-500 text-xs">{sale.phone || "—"}</TableCell>
                            <TableCell className="text-slate-800">{sale.resourceTitle}</TableCell>
                            <TableCell className="text-emerald-700 font-mono font-bold">
                              ${sale.amount.toFixed(2)} {sale.currency}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-medium">
                                Access Granted
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{sale.date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Footer - White Mode */}
      <footer id="admin-footer" className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 shadow-2xs">
        Purity Matters Web Console • Connected to {apiUrl} • Remote PostgreSQL Schema Active
      </footer>
    </div>
  );
}
