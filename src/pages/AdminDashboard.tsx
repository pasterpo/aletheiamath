import { useState } from 'react';
import { Shield, Users, Plus, BookOpen, Settings, Award, Sliders, GraduationCap } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHasPermission } from '@/hooks/useRoles';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { UserManagement } from '@/components/admin/UserManagement';
import { ProblemManagement } from '@/components/admin/ProblemManagement';
import { UIPermissionManager } from '@/components/admin/UIPermissionManager';
import { Badge } from '@/components/ui/badge';
import { useIMOWaitlist } from '@/hooks/useIMOWaitlist';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, isLoading, role } = useHasPermission('staff');
  const [activeTab, setActiveTab] = useState('overview');
  const { data: imoWaitlist = [], isLoading: loadingWaitlist } = useIMOWaitlist();

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasPermission) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="heading-subsection mb-2">Access Denied</h2>
                <p className="text-muted-foreground">
                  You don't have permission to access the Admin Dashboard.
                  Only Staff and above can access this area.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const roleColor = {
    developer: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    staff: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    moderator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    member: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="heading-section flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage users, problems, and platform settings
              </p>
            </div>
            <Badge className={roleColor[role || 'member']}>
              {role?.toUpperCase()}
            </Badge>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-2 bg-secondary/50">
              <TabsTrigger value="overview" className="gap-2">
                <Settings className="w-4 h-4" />
                Overview
              </TabsTrigger>
              {role === 'developer' && (
                <TabsTrigger value="users" className="gap-2">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
              )}
              <TabsTrigger value="problems" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Problems
              </TabsTrigger>
              {role === 'developer' && (
                <TabsTrigger value="ui-permissions" className="gap-2">
                  <Sliders className="w-4 h-4" />
                  UI Control
                </TabsTrigger>
              )}
              {role === 'developer' && (
                <TabsTrigger value="imo-waitlist" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  IMO Waitlist
                  {imoWaitlist.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {imoWaitlist.length}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="stats" className="gap-2">
                <Award className="w-4 h-4" />
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">—</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Problems Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">—</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Submissions Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">—</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">—</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('problems')}
                    className="flex items-center gap-3 p-4 rounded-lg border hover:bg-secondary/50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-primary" />
                    <span>Add New Problem</span>
                  </button>
                  {role === 'developer' && (
                    <button
                      onClick={() => setActiveTab('users')}
                      className="flex items-center gap-3 p-4 rounded-lg border hover:bg-secondary/50 transition-colors"
                    >
                      <Users className="w-5 h-5 text-primary" />
                      <span>Manage Users</span>
                    </button>
                  )}
                  <button className="flex items-center gap-3 p-4 rounded-lg border hover:bg-secondary/50 transition-colors">
                    <Settings className="w-5 h-5 text-primary" />
                    <span>Platform Settings</span>
                  </button>
                </CardContent>
              </Card>
            </TabsContent>

            {role === 'developer' && (
              <TabsContent value="users">
                <UserManagement />
              </TabsContent>
            )}

            <TabsContent value="problems">
              <ProblemManagement />
            </TabsContent>

            {role === 'developer' && (
              <TabsContent value="ui-permissions">
                <UIPermissionManager />
              </TabsContent>
            )}

            {role === 'developer' && (
              <TabsContent value="imo-waitlist">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      IMO 2027 Program Applications ({imoWaitlist.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingWaitlist ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : imoWaitlist.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Country</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead>Motivation</TableHead>
                              <TableHead>Applied At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {imoWaitlist.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="font-medium">{entry.full_name}</TableCell>
                                <TableCell>{entry.email}</TableCell>
                                <TableCell>{entry.country || '-'}</TableCell>
                                <TableCell>{entry.current_level || '-'}</TableCell>
                                <TableCell className="max-w-xs truncate">{entry.motivation || '-'}</TableCell>
                                <TableCell>{format(new Date(entry.created_at), 'MMM d, yyyy')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No applications yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="stats">
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="heading-subsection mb-2">Statistics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and platform metrics will be available here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
