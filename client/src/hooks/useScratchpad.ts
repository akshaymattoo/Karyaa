import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { InsertScratchpad, ScratchpadItem } from '@shared/schema';
import { useEffect, useState } from 'react';

export function useScratchpad() {
  const { user } = useAuth();
  const [items, setItems] = useState<ScratchpadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScratchpad = async () => {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/scratchpad', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setItems(data);
        }
      } catch (error) {
        console.error('Error loading scratchpad:', error);
      }

      setLoading(false);
    };

    loadScratchpad();
  }, [user]);

  const addItem = async (title: string) => {
    if (!user) return;
    
    const newItem: InsertScratchpad = {
      userId: user.id,
      title,
    };

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('No auth token');
      }

      const response = await fetch('/api/scratchpad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        const createdItem = await response.json();
        setItems([...items, createdItem]);
        return createdItem;
      }
    } catch (error) {
      console.error('Error creating scratchpad item:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('No auth token');
      }

      const response = await fetch(`/api/scratchpad/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error deleting scratchpad item:', error);
    }
  };

  return {
    items,
    loading,
    addItem,
    deleteItem,
  };
}
