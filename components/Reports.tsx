import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Member, AttendanceSession, AttendanceRecord, Department, MembershipType, UserRole } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { DownloadIcon } from './icons';

interface ReportsProps {
  members: Member[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  currentRole: UserRole;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
        <p className="label font-semibold">{`${label}`}</p>
        <p className="intro" style={{ color: payload[0].fill || payload[0].stroke }}>
          {`${payload[0].name} : ${payload[0].value}%`}
        </p>
      </div>
    );
  }
  return null;
};


const Reports: React.FC<ReportsProps> = ({ members, sessions, records, currentRole }) => {

  const attendanceByMonth = useMemo(() => {
    const data: { [key: string]: { present: number; opportunities: number } } = {};
    
    sessions.forEach(session => {
        const month = new Date(session.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!data[month]) data[month] = { present: 0, opportunities: 0 };

        const relevantMembers = session.department
            ? members.filter(m => m.department === session.department)
            : members.filter(m => m.membershipType !== MembershipType.Visitor);
        
        relevantMembers.forEach(member => {
            data[month].opportunities += 1;
            const record = records.find(r => r.sessionId === session.id && r.memberId === member.id);
            if (record?.present) {
                data[month].present += 1;
            }
        });
    });

    return Object.keys(data).map(month => ({
        month,
        "Attendance Rate": data[month].opportunities > 0 ? parseFloat(((data[month].present / data[month].opportunities) * 100).toFixed(1)) : 0
    })).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [sessions, records, members]);

  const attendanceByDepartment = useMemo(() => {
    const departmentData: { [key in Department]?: { present: 0; opportunities: 0 } } = {};
    
    Object.values(Department).forEach(dep => {
        if(dep !== Department.None) departmentData[dep] = { present: 0, opportunities: 0 };
    });

    sessions.forEach(session => {
        const relevantMembers = session.department
            ? members.filter(m => m.department === session.department)
            : members.filter(m => m.membershipType !== MembershipType.Visitor);

        relevantMembers.forEach(member => {
            const dep = member.department;
            if (dep !== Department.None && departmentData[dep]) {
                 departmentData[dep]!.opportunities += 1;
                 const record = records.find(r => r.sessionId === session.id && r.memberId === member.id);
                 if (record?.present) {
                     departmentData[dep]!.present += 1;
                 }
            }
        });
    });

    return Object.entries(departmentData).map(([department, data]) => ({
      department,
      "Attendance Rate": data.opportunities > 0 ? parseFloat(((data.present / data.opportunities) * 100).toFixed(1)) : 0,
    }));
  }, [members, sessions, records]);
  
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-t8,";
    csvContent += "Session ID,Session Name,Date,Member ID,Member Name,Present\n";
    
    records.forEach(record => {
      const session = sessions.find(s => s.id === record.sessionId);
      const member = members.find(m => m.id === record.memberId);
      if (session && member) {
        csvContent += `${session.id},"${session.name}","${new Date(session.date).toLocaleDateString()}",${member.id},"${member.fullName}",${record.present ? 'Yes' : 'No'}\n`;
      }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
       <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold text-gw-dark">Reports & Insights</h1>
              <p className="text-gray-500">Analyze attendance trends and data.</p>
          </div>
          {currentRole === UserRole.Admin && (
            <Button onClick={handleExportCSV} icon={<DownloadIcon className="h-5 w-5"/>}>
              Export to CSV
            </Button>
          )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-bold text-gw-dark mb-4">Monthly Attendance Rate</h3>
           <div className="h-80">
            {attendanceByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceByMonth} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis unit="%" domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="Attendance Rate" stroke="#B8860B" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No monthly data to display.</div>
            )}
        </div>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-gw-dark mb-4">Attendance Rate by Department</h3>
          <div className="h-80">
            {attendanceByDepartment.filter(d => d['Attendance Rate'] > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceByDepartment} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" unit="%" domain={[0, 100]} />
                        <YAxis dataKey="department" type="category" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Attendance Rate" fill="#B8860B">
                            <LabelList dataKey="Attendance Rate" position="right" className="fill-gw-dark" formatter={(value: number) => `${value}%`} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No department data to display.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;