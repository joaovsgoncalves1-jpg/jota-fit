import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const DAYS = [
  { value: 'mon', label: 'Seg' },
  { value: 'tue', label: 'Ter' },
  { value: 'wed', label: 'Qua' },
  { value: 'thu', label: 'Qui' },
  { value: 'fri', label: 'Sex' },
  { value: 'sat', label: 'Sáb' },
  { value: 'sun', label: 'Dom' },
];

export default function AssignWorkoutDialog({ workout, open, onClose }) {
  const queryClient = useQueryClient();
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });

  const toggleEmail = (email) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const toggleDay = (day) => {
    setRecurringDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      const assignments = selectedEmails.map(email => ({
        workout_id: workout.id,
        student_email: email,
        scheduled_date: recurring ? '' : scheduledDate,
        recurring,
        recurring_days: recurring ? recurringDays : [],
      }));
      await base44.entities.WorkoutAssignment.bulkCreate(assignments);
    },
    onSuccess: () => {
      toast.success('Treino atribuído!');
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      onClose();
      setSelectedEmails([]);
      setScheduledDate('');
      setRecurring(false);
      setRecurringDays([]);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir: {workout?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Students */}
          <div>
            <Label>Selecionar Alunos</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {(profiles || []).map(p => (
                <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                  <Checkbox
                    checked={selectedEmails.includes(p.email)}
                    onCheckedChange={() => toggleEmail(p.email)}
                  />
                  <span className="text-sm">{p.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{p.email}</span>
                </label>
              ))}
            </div>
            <button
              className="text-xs text-primary mt-2 hover:underline"
              onClick={() => setSelectedEmails((profiles || []).map(p => p.email))}
            >
              Selecionar todos
            </button>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={recurring} onCheckedChange={setRecurring} />
              <span className="text-sm">Recorrente</span>
            </label>
          </div>

          {recurring ? (
            <div>
              <Label>Dias da Semana</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${recurringDays.includes(day.value) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
          )}

          <Button
            onClick={() => assignMutation.mutate()}
            disabled={selectedEmails.length === 0 || assignMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {assignMutation.isPending ? 'Atribuindo...' : `Atribuir a ${selectedEmails.length} aluno(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}