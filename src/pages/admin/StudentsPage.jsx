import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateLevel } from '@/lib/gamification';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Plus, Search, UserPlus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import StreakBadge from '@/components/game/StreakBadge';
import { toast } from 'sonner';

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-xp_total'),
  });

  const { data: levelConfigs } = useQuery({
    queryKey: ['level-configs'],
    queryFn: () => base44.entities.LevelConfig.list(),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Create student profile
      await base44.entities.StudentProfile.create({
        email: newEmail,
        name: newName,
        xp_total: 0,
        current_streak: 0,
        max_streak: 0,
        active: true,
      });
      // Invite the user
      await base44.users.inviteUser(newEmail, 'student');
    },
    onSuccess: () => {
      toast.success('Aluno convidado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      setDialogOpen(false);
      setNewName('');
      setNewEmail('');
    },
  });

  const filtered = (profiles || []).filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold">ALUNOS</h1>
          <span className="text-sm text-muted-foreground">({profiles?.length || 0})</span>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 bg-primary hover:bg-primary/90">
              <UserPlus className="w-4 h-4" /> Convidar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Convidar Novo Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nome do aluno"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="mt-1.5"
                />
              </div>
              <Button
                onClick={() => inviteMutation.mutate()}
                disabled={!newName || !newEmail || inviteMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {inviteMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                O aluno receberá um e-mail para criar sua senha e acessar o app.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar aluno..."
          className="pl-10"
        />
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filtered.map((student, i) => {
          const lvl = calculateLevel(student.xp_total || 0, levelConfigs);
          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link to={`/aluno/${student.id}`}>
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center font-bold text-sm shrink-0">
                    {student.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">{student.name}</span>
                      {!student.active && (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">Inativo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">Nv.{lvl.level} • {lvl.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {student.current_streak > 0 && (
                      <StreakBadge days={student.current_streak} size="sm" />
                    )}
                    <div className="text-right">
                      <span className="font-display text-sm font-bold text-gold">{student.xp_total || 0}</span>
                      <p className="text-[10px] text-muted-foreground">XP</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">{search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado ainda'}</p>
        </div>
      )}
    </div>
  );
}