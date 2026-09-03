import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { NavigationItem } from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { InterfacesView } from './components/views/InterfacesView';
import { PppoeView } from './components/views/PppoeView';
import { CustomersView } from './components/views/CustomersView';
import { PackagesView } from './components/views/PackagesView';
import { BillingView } from './components/views/BillingView';
import { PaymentsView } from './components/views/PaymentsView';
import { FirewallView } from './components/views/FirewallView';
import { QosView } from './components/views/QosView';
import { HotspotView } from './components/views/HotspotView';
import { DhcpView } from './components/views/DhcpView';
import { LogsView } from './components/views/LogsView';
import { SettingsView } from './components/views/SettingsView';
import { CustomerPortalModal } from './components/modals/CustomerPortalModal';
import { SetupWizardModal } from './components/modals/SetupWizardModal';
import { HotspotCaptivePortalModal } from './components/modals/HotspotCaptivePortalModal';

export default function App() {
  const [currentView, setCurrentView] = useState<NavigationItem>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [portalMode, setPortalMode] = useState<'admin' | 'customer' | 'wizard' | 'hotspot'>('admin');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const storage = StorageService.getInstance();
    const unsubscribe = storage.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (view: string) => {
    if (view === 'pppoe-sessions') {
      setCurrentView('pppoe');
    } else if (view === 'reports') {
      setCurrentView('billing');
    } else if (view === 'vlans' || view === 'routing' || view === 'diagnostics') {
      setCurrentView('interfaces');
    } else if (view === 'nat') {
      setCurrentView('firewall');
    } else if (view === 'ipam') {
      setCurrentView('dhcp');
    } else if (view === 'versioning' || view === 'system' || view === 'api-docs') {
      setCurrentView('settings');
    } else {
      setCurrentView(view as NavigationItem);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onSelectView={handleNavigate} onNavigate={handleNavigate} />;
      case 'interfaces':
        return <InterfacesView />;
      case 'pppoe':
        return <PppoeView />;
      case 'customers':
        return <CustomersView />;
      case 'packages':
        return <PackagesView />;
      case 'billing':
        return <BillingView />;
      case 'payments':
        return <PaymentsView />;
      case 'firewall':
        return <FirewallView />;
      case 'qos':
        return <QosView />;
      case 'hotspot':
        return <HotspotView />;
      case 'dhcp':
        return <DhcpView />;
      case 'logs':
        return <LogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onSelectView={handleNavigate} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased selection:bg-cyan-500 selection:text-white">
      {/* Desktop & Mobile Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          currentView={currentView}
          onSelectView={handleNavigate}
          onNavigate={handleNavigate}
          isOpen={false}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Mobile Drawer */}
      <div className="lg:hidden">
        <Sidebar
          currentView={currentView}
          onSelectView={handleNavigate}
          onNavigate={handleNavigate}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentView={currentView}
          onSelectView={handleNavigate}
          onNavigate={handleNavigate}
          portalMode={portalMode}
          onTogglePortalMode={mode => setPortalMode(mode)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Interactive Customer Self-Service Portal Modal */}
      <CustomerPortalModal
        isOpen={portalMode === 'customer'}
        onClose={() => setPortalMode('admin')}
      />

      {/* First-Run Quick Setup Wizard Modal */}
      <SetupWizardModal
        isOpen={portalMode === 'wizard'}
        onClose={() => setPortalMode('admin')}
      />

      {/* Mobile Hotspot & Wi-Fi Captive Portal Modal */}
      <HotspotCaptivePortalModal
        isOpen={portalMode === 'hotspot'}
        onClose={() => setPortalMode('admin')}
      />
    </div>
  );
}
