
import React, { useState } from 'react';
import { AccountSettings } from './AccountSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { NotificationSettings } from './NotificationSettings';
import { CollaborationSettings } from '../CollaborationSettings';

type Section = 'account' | 'appearance' | 'notifications' | 'collaboration';

export function SettingsTabs() {
  const [activeSection, setActiveSection] = useState<Section>('account');
  
  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
  };

  const menuItems = [
    { id: 'account', label: 'Configurações da Conta' },
    { id: 'appearance', label: 'Aparência' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'collaboration', label: 'Colaboração' }
  ] as const;

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'collaboration':
        return <CollaborationSettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="rounded-lg border border-white/10">
      <div className="border-b border-white/10">
        <nav className="flex flex-wrap gap-2 overflow-x-auto">
          {menuItems.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleSectionChange(id as Section)}
              className={`w-full sm:w-auto min-w-[12rem] sm:min-w-0 px-6 py-3 text-sm font-medium text-left sm:text-center transition-colors border-b-2 ${
                activeSection === id
                  ? 'text-purple-400 border-purple-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
}
