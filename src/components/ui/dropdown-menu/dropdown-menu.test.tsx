import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuGroup,
} from './dropdown-menu';
import React from 'react';

describe('DropdownMenu', () => {
  it('should render the trigger and open the menu on click', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuItem>Subscription</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    // 1. Check if the trigger is rendered
    const triggerButton = screen.getByText('Open Menu');
    expect(triggerButton).toBeInTheDocument();

    // The menu should not be visible initially
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();

    // 3. Click the trigger to open the menu
    await user.click(triggerButton);

    // 4. Check if the menu content is now visible
    const menuContent = await screen.findByTestId('dropdown-menu-content');
    expect(menuContent).toBeInTheDocument();
    expect(await screen.findByText('My Account')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('should render a shortcut', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            New Tab
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const shortcut = await screen.findByText('⌘+T');
    expect(shortcut).toBeInTheDocument();
    expect(shortcut).toHaveClass('ml-auto text-xs tracking-widest text-muted-foreground');
  });

  it('should render a group of items', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const profileItem = await screen.findByText('Profile');
    const settingsItem = await screen.findByText('Settings');
    expect(profileItem).toBeInTheDocument();
    expect(settingsItem).toBeInTheDocument();
  });

  it('should render an inset item and label', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Guests</DropdownMenuLabel>
          <DropdownMenuItem inset>Invite link</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const guestsLabel = await screen.findByText('Guests');
    const inviteLinkItem = await screen.findByText('Invite link');
    expect(guestsLabel).toBeInTheDocument();
    expect(guestsLabel).toHaveAttribute('data-inset');
    expect(inviteLinkItem).toBeInTheDocument();
    expect(inviteLinkItem).toHaveAttribute('data-inset');
  });

  it('should render a separator with a custom className', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuSeparator className="my-4" />
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const separator = document.querySelector(
      '[role="separator"]'
    ) as HTMLElement;
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('my-4');
  });

  it('should render with a different direction', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const menuContent = await screen.findByTestId('dropdown-menu-content');
    expect(menuContent).toHaveAttribute('dir', 'rtl');
  });

  it('should render as a modal', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const menuContent = await screen.findByTestId('dropdown-menu-content');
    expect(menuContent).toBeInTheDocument();
  });

  it('should work with a custom trigger', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div data-testid="custom-trigger">Open</div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByTestId('custom-trigger');
    await user.click(trigger);

    const menuItem = await screen.findByText('Profile');
    expect(menuItem).toBeInTheDocument();
  });

  it('should handle submenus', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const triggerButton = screen.getByText('Open Menu');
    await user.click(triggerButton);

    const subTrigger = screen.getByText('Invite');
    await user.hover(subTrigger);

    const emailMenuItem = await screen.findByText('Email');
    expect(emailMenuItem).toBeInTheDocument();
  });

  it('should be controllable with open and onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const TestComponent = ({ open }: { open: boolean }) => (
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const { rerender } = render(<TestComponent open={false} />);
    const triggerButton = screen.getByText('Open Menu');
    expect(
      screen.queryByTestId('dropdown-menu-content')
    ).not.toBeInTheDocument();

    await user.click(triggerButton);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerender(<TestComponent open={true} />);
    const menuContent = await screen.findByTestId('dropdown-menu-content');
    expect(menuContent).toBeInTheDocument();
  });

  it('should be open by default', async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const menuContent = await screen.findByTestId('dropdown-menu-content');
    expect(menuContent).toBeInTheDocument();
  });

  it('should handle complex interactions with different item types', async () => {
    const user = userEvent.setup();
    const onSelectSpy = vi.fn(e => e.preventDefault()); // Prevent menu from closing

    // A more complex setup to test all item types
    const TestComponent = () => {
      const [showStatusBar, setShowStatusBar] = React.useState(true);
      const [showActivityBar, setShowActivityBar] = React.useState(false);
      const [position, setPosition] = React.useState('bottom');

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>Open Complex Menu</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showStatusBar}
              onCheckedChange={setShowStatusBar}
              onSelect={e => e.preventDefault()} // Prevent menu from closing
            >
              Status Bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showActivityBar}
              onCheckedChange={setShowActivityBar}
              disabled
            >
              Activity Bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuItem disabled>
              API <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
              <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="top" onSelect={e => e.preventDefault()}>
                Top
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bottom" onSelect={e => e.preventDefault()}>
                Bottom
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="right" onSelect={e => e.preventDefault()}>
                Right
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSelectSpy}>API</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>More Tools</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={e => e.preventDefault()}>
                    Save Page As...
                  </DropdownMenuItem>
                  <DropdownMenuItem>Create Shortcut...</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    };

    render(<TestComponent />);

    const trigger = screen.getByText('Open Complex Menu');
    await user.click(trigger);

    // Test checkbox items
    const statusBarCheckbox = await screen.findByRole('menuitemcheckbox', {
      name: /status bar/i,
    });
    expect(statusBarCheckbox).toBeChecked();
    await user.click(statusBarCheckbox);
    expect(statusBarCheckbox).not.toBeChecked();

    // Test disabled checkbox item
    const activityBarCheckbox = await screen.findByRole('menuitemcheckbox', {
      name: /activity bar/i,
    });
    expect(activityBarCheckbox).toHaveAttribute('aria-disabled', 'true');

    // Test radio items
    const bottomRadio = await screen.findByRole('menuitemradio', {
      name: /bottom/i,
    });
    const rightRadio = await screen.findByRole('menuitemradio', {
      name: /right/i,
    });
    expect(bottomRadio).toBeChecked();
    expect(rightRadio).not.toBeChecked();
    await user.click(rightRadio);
    expect(bottomRadio).not.toBeChecked();
    expect(rightRadio).toBeChecked();

    // Test standard item onSelect
    const apiItems = screen.getAllByText('API');
    const enabledApiItem = apiItems.find(
      item => !item.hasAttribute('aria-disabled')
    );
    const disabledApiItem = apiItems.find(item =>
      item.hasAttribute('aria-disabled')
    );

    if (enabledApiItem) {
      await user.click(enabledApiItem);
      expect(onSelectSpy).toHaveBeenCalled();
    }

    if (disabledApiItem) {
      await user.click(disabledApiItem);
      expect(onSelectSpy).toHaveBeenCalledTimes(1); // Should not be called again
    }

    // Test sub-menu
    const subTrigger = screen.getByText('More Tools');
    await user.hover(subTrigger);
    const subMenuItem = await screen.findByText('Save Page As...');
    expect(subMenuItem).toBeInTheDocument();
    await user.click(subMenuItem);
  });
}); 