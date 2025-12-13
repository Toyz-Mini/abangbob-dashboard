'use client';

import { useMemo } from 'react';
import { useStaffPortal, useStaff } from '@/lib/store';
import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';

interface TeamTodayWidgetProps {
  currentStaffId: string;
}

export default function TeamTodayWidget({ currentStaffId }: TeamTodayWidgetProps) {
  const { staff } = useStaff();
  const { schedules, shifts } = useStaffPortal();

  const today = new Date().toISOString().split('T')[0];

  // Get all staff working today
  const teamToday = useMemo(() => {
    const todaySchedules = schedules.filter(s => s.date === today && s.staffId !== currentStaffId);
    
    return todaySchedules.map(schedule => {
      const staffMember = staff.find(s => s.id === schedule.staffId);
      const shift = shifts.find(s => s.id === schedule.shiftId);
      
      return {
        id: schedule.staffId,
        name: staffMember?.name || schedule.staffName,
        initial: staffMember?.name?.charAt(0) || '?',
        shift: shift?.name || 'Unknown',
        shiftTime: shift ? `${shift.startTime} - ${shift.endTime}` : '',
        shiftColor: shift?.color || '#6366f1'
      };
    });
  }, [schedules, staff, shifts, today, currentStaffId]);

  if (teamToday.length === 0) {
    return null;
  }

  return (
    <div className="team-today-widget">
      <div className="team-today-header">
        <div className="team-today-title">
          <Users size={18} />
          <span>Team Hari Ini</span>
        </div>
        <span className="team-today-count">{teamToday.length} orang</span>
      </div>
      
      <div className="team-today-avatars">
        {teamToday.slice(0, 5).map((member, index) => (
          <div 
            key={member.id}
            className="team-avatar"
            style={{ 
              zIndex: 10 - index,
              background: member.shiftColor,
              marginLeft: index > 0 ? '-10px' : '0'
            }}
            title={`${member.name} - ${member.shift}`}
          >
            {member.initial}
          </div>
        ))}
        {teamToday.length > 5 && (
          <div 
            className="team-avatar team-avatar-more"
            style={{ marginLeft: '-10px' }}
          >
            +{teamToday.length - 5}
          </div>
        )}
      </div>
      
      <div className="team-today-list">
        {teamToday.slice(0, 3).map(member => (
          <div key={member.id} className="team-member-row">
            <div 
              className="team-member-avatar-small"
              style={{ background: member.shiftColor }}
            >
              {member.initial}
            </div>
            <div className="team-member-info">
              <span className="team-member-name">{member.name}</span>
              <span className="team-member-shift">{member.shiftTime}</span>
            </div>
          </div>
        ))}
      </div>

      {teamToday.length > 3 && (
        <Link href="/staff-portal/schedule" className="team-today-link">
          Lihat semua <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

