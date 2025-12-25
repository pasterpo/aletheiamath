import { useState } from 'react';
import { Plus, Search, Trash2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useUIPermissions,
  useCreateUIPermission,
  useUpdateUIPermission,
  useDeleteUIPermission,
  UIPermission,
} from '@/hooks/useUIPermissions';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/hooks/useRoles';

const ALL_ROLES: AppRole[] = ['developer', 'staff', 'moderator', 'member'];
const ELEMENT_TYPES = ['button', 'link', 'section', 'page', 'input', 'other'];

export function UIPermissionManager() {
  const { toast } = useToast();
  const { data: permissions = [], isLoading } = useUIPermissions();
  const createPermission = useCreateUIPermission();
  const updatePermission = useUpdateUIPermission();
  const deletePermission = useDeleteUIPermission();
  
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<UIPermission | null>(null);
  const [formData, setFormData] = useState({
    element_key: '',
    element_name: '',
    element_type: 'button',
    visible_to_roles: [...ALL_ROLES] as string[],
    interactable_by_roles: [...ALL_ROLES] as string[],
    description: '',
  });

  const filteredPermissions = permissions.filter(p =>
    p.element_name.toLowerCase().includes(search.toLowerCase()) ||
    p.element_key.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      element_key: '',
      element_name: '',
      element_type: 'button',
      visible_to_roles: [...ALL_ROLES],
      interactable_by_roles: [...ALL_ROLES],
      description: '',
    });
  };

  const openEdit = (permission: UIPermission) => {
    setEditingPermission(permission);
    setFormData({
      element_key: permission.element_key,
      element_name: permission.element_name,
      element_type: permission.element_type,
      visible_to_roles: [...permission.visible_to_roles],
      interactable_by_roles: [...permission.interactable_by_roles],
      description: permission.description || '',
    });
  };

  const handleCreate = async () => {
    try {
      await createPermission.mutateAsync(formData);
      toast({ title: 'Permission created successfully' });
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create permission',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingPermission) return;
    try {
      await updatePermission.mutateAsync({
        id: editingPermission.id,
        ...formData,
      });
      toast({ title: 'Permission updated successfully' });
      setEditingPermission(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update permission',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;
    try {
      await deletePermission.mutateAsync(id);
      toast({ title: 'Permission deleted successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete permission',
        variant: 'destructive',
      });
    }
  };

  const toggleRole = (field: 'visible_to_roles' | 'interactable_by_roles', role: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(role)
        ? prev[field].filter(r => r !== role)
        : [...prev[field], role],
    }));
  };

  const RoleCheckboxGroup = ({ field, label }: { field: 'visible_to_roles' | 'interactable_by_roles'; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-4">
        {ALL_ROLES.map(role => (
          <div key={role} className="flex items-center gap-2">
            <Checkbox
              id={`${field}-${role}`}
              checked={formData[field].includes(role)}
              onCheckedChange={() => toggleRole(field, role)}
            />
            <label htmlFor={`${field}-${role}`} className="text-sm capitalize">
              {role}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const PermissionForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="element_key">Element Key *</Label>
          <Input
            id="element_key"
            value={formData.element_key}
            onChange={(e) => setFormData({ ...formData, element_key: e.target.value })}
            placeholder="e.g., admin_delete_button"
            disabled={isEdit}
          />
          <p className="text-xs text-muted-foreground">Unique identifier used in code</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="element_name">Display Name *</Label>
          <Input
            id="element_name"
            value={formData.element_name}
            onChange={(e) => setFormData({ ...formData, element_name: e.target.value })}
            placeholder="e.g., Admin Delete Button"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="element_type">Element Type</Label>
          <Select
            value={formData.element_type}
            onValueChange={(value) => setFormData({ ...formData, element_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ELEMENT_TYPES.map(type => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What this element does..."
          />
        </div>
      </div>

      <RoleCheckboxGroup field="visible_to_roles" label="Visible to Roles" />
      <RoleCheckboxGroup field="interactable_by_roles" label="Interactable by Roles" />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            UI Permission Manager
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Permission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create UI Permission</DialogTitle>
                <DialogDescription>
                  Define which roles can see and interact with a UI element.
                </DialogDescription>
              </DialogHeader>
              <PermissionForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.element_key || !formData.element_name}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Permissions Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredPermissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search ? 'No permissions found matching your search' : 'No UI permissions configured yet'}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Element</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Visible To</TableHead>
                  <TableHead>Interactable By</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{permission.element_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{permission.element_key}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {permission.element_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {permission.visible_to_roles.map(role => (
                          <Badge key={role} variant="secondary" className="text-xs capitalize">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {permission.interactable_by_roles.map(role => (
                          <Badge key={role} variant="secondary" className="text-xs capitalize">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(permission)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(permission.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingPermission} onOpenChange={(open) => !open && setEditingPermission(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit UI Permission</DialogTitle>
              <DialogDescription>
                Update which roles can see and interact with this element.
              </DialogDescription>
            </DialogHeader>
            <PermissionForm isEdit />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPermission(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}