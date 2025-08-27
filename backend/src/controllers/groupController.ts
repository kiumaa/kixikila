import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, AuthorizationError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export class GroupController {
  /**
   * Get all groups for the authenticated user
   */
  static async getUserGroups(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      logger.info('Getting user groups', { userId });
      
      const { data: groups, error } = await supabase
        .from('group_members')
        .select(`
          groups (
            id,
            name,
            description,
            type,
            currency,
            is_active,
            created_at,
            updated_at,
            created_by,
            member_count,
            total_balance
          ),
          role,
          joined_at,
          is_active
        `)
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) {
        logger.error('Error fetching user groups:', error);
        throw new Error('Failed to fetch groups');
      }
      
      const formattedGroups = groups?.map(member => ({
        ...member.groups,
        userRole: member.role,
        joinedAt: member.joined_at,
        isUserActive: member.is_active
      })) || [];
      
      res.json({
        success: true,
        message: 'Groups retrieved successfully',
        data: formattedGroups
      });
      
    } catch (error) {
      logger.error('Error in getUserGroups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve groups'
      });
    }
  }
  
  /**
   * Get group details by ID
   */
  static async getGroupById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      logger.info('Getting group details', { groupId: id, userId });
      
      // Check if user is a member of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('role, is_active')
        .eq('group_id', id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (membershipError || !membership) {
        throw new AuthorizationError('You are not a member of this group');
      }
      
      // Get group details
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner (
            user_id,
            role,
            joined_at,
            is_active,
            users (
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (groupError || !group) {
        throw new NotFoundError('Group not found');
      }
      
      // Format response
      const formattedGroup = {
        ...group,
        userRole: membership.role,
        members: group.group_members
          .filter((member: any) => member.is_active)
          .map((member: any) => ({
            id: member.users.id,
            fullName: member.users.full_name,
            email: member.users.email,
            avatarUrl: member.users.avatar_url,
            role: member.role,
            joinedAt: member.joined_at
          }))
      };
      
      delete formattedGroup.group_members;
      
      res.json({
        success: true,
        message: 'Group details retrieved successfully',
        data: formattedGroup
      });
      
    } catch (error) {
      logger.error('Error in getGroupById:', error);
      
      if (error instanceof AuthorizationError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve group details'
        });
      }
    }
  }
  
  /**
   * Create a new group
   */
  static async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, description, type, currency } = req.body;
      
      logger.info('Creating new group', { userId, name, type });
      
      const groupId = uuidv4();
      
      // Start transaction
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          id: groupId,
          name,
          description,
          type,
          currency: currency || 'AOA',
          created_by: userId,
          is_active: true,
          member_count: 1,
          total_balance: 0
        })
        .select()
        .single();
      
      if (groupError) {
        logger.error('Error creating group:', groupError);
        throw new Error('Failed to create group');
      }
      
      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'admin',
          is_active: true
        });
      
      if (memberError) {
        logger.error('Error adding group creator as member:', memberError);
        // Rollback group creation
        await supabase.from('groups').delete().eq('id', groupId);
        throw new Error('Failed to create group membership');
      }
      
      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: {
          ...group,
          userRole: 'admin'
        }
      });
      
    } catch (error) {
      logger.error('Error in createGroup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create group'
      });
    }
  }
  
  /**
   * Update group details
   */
  static async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { name, description, currency } = req.body;
      
      logger.info('Updating group', { groupId: id, userId });
      
      // Check if user is admin of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (membershipError || !membership || membership.role !== 'admin') {
        throw new AuthorizationError('Only group admins can update group details');
      }
      
      // Update group
      const { data: updatedGroup, error: updateError } = await supabase
        .from('groups')
        .update({
          name,
          description,
          currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_active', true)
        .select()
        .single();
      
      if (updateError) {
        logger.error('Error updating group:', updateError);
        throw new Error('Failed to update group');
      }
      
      if (!updatedGroup) {
        throw new NotFoundError('Group not found');
      }
      
      res.json({
        success: true,
        message: 'Group updated successfully',
        data: updatedGroup
      });
      
    } catch (error) {
      logger.error('Error in updateGroup:', error);
      
      if (error instanceof ForbiddenError || error instanceof NotFoundError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update group'
        });
      }
    }
  }
  
  /**
   * Delete/deactivate a group
   */
  static async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      logger.info('Deleting group', { groupId: id, userId });
      
      // Check if user is admin of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (membershipError || !membership || membership.role !== 'admin') {
        throw new AuthorizationError('Only group admins can delete groups');
      }
      
      // Check if group has active transactions
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('id')
        .eq('group_id', id)
        .limit(1);
      
      if (transactionError) {
        logger.error('Error checking group transactions:', transactionError);
        throw new Error('Failed to verify group status');
      }
      
      if (transactions && transactions.length > 0) {
        throw new ValidationError('Cannot delete group with existing transactions');
      }
      
      // Deactivate group and all memberships
      const { error: groupError } = await supabase
        .from('groups')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (groupError) {
        logger.error('Error deactivating group:', groupError);
        throw new Error('Failed to delete group');
      }
      
      // Deactivate all memberships
      const { error: memberError } = await supabase
        .from('group_members')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('group_id', id);
      
      if (memberError) {
        logger.error('Error deactivating group memberships:', memberError);
      }
      
      res.json({
        success: true,
        message: 'Group deleted successfully'
      });
      
    } catch (error) {
      logger.error('Error in deleteGroup:', error);
      
      if (error instanceof AuthorizationError || error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete group'
        });
      }
    }
  }
  
  /**
   * Add member to group
   */
  static async addMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { email, role = 'member' } = req.body;
      
      logger.info('Adding member to group', { groupId: id, email, role });
      
      // Check if user is admin of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (membershipError || !membership || membership.role !== 'admin') {
        throw new AuthorizationError('Only group admins can add members');
      }
      
      // Find user by email
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();
      
      if (userError || !targetUser) {
        throw new NotFoundError('User not found');
      }
      
      // Check if user is already a member
      const { data: existingMember, error: existingError } = await supabase
        .from('group_members')
        .select('id, is_active')
        .eq('group_id', id)
        .eq('user_id', targetUser.id)
        .single();
      
      if (existingMember) {
        if (existingMember.is_active) {
          throw new ValidationError('User is already a member of this group');
        } else {
          // Reactivate membership
          const { error: reactivateError } = await supabase
            .from('group_members')
            .update({ 
              is_active: true,
              role,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMember.id);
          
          if (reactivateError) {
            logger.error('Error reactivating membership:', reactivateError);
            throw new Error('Failed to add member');
          }
        }
      } else {
        // Add new member
        const { error: addError } = await supabase
          .from('group_members')
          .insert({
            group_id: id,
            user_id: targetUser.id,
            role,
            is_active: true
          });
        
        if (addError) {
          logger.error('Error adding member:', addError);
          throw new Error('Failed to add member');
        }
      }
      
      // Update group member count
      const { error: countError } = await supabase
        .rpc('update_group_member_count', { group_id: id });
      
      if (countError) {
        logger.error('Error updating member count:', countError);
      }
      
      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: {
          id: targetUser.id,
          fullName: targetUser.full_name,
          email: targetUser.email,
          role
        }
      });
      
    } catch (error) {
      logger.error('Error in addMember:', error);
      
      if (error instanceof AuthorizationError || error instanceof NotFoundError || error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to add member'
        });
      }
    }
  }
  
  /**
   * Remove member from group
   */
  static async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const { id, memberId } = req.params;
      const userId = req.user!.id;
      
      logger.info('Removing member from group', { groupId: id, memberId });
      
      // Check if user is admin of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (membershipError || !membership || membership.role !== 'admin') {
        throw new AuthorizationError('Only group admins can remove members');
      }
      
      // Cannot remove group creator
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', id)
        .single();
      
      if (groupError || !group) {
        throw new NotFoundError('Group not found');
      }
      
      if (group.created_by === memberId) {
        throw new ValidationError('Cannot remove group creator');
      }
      
      // Deactivate membership
      const { error: removeError } = await supabase
        .from('group_members')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('group_id', id)
        .eq('user_id', memberId);
      
      if (removeError) {
        logger.error('Error removing member:', removeError);
        throw new Error('Failed to remove member');
      }
      
      // Update group member count
      const { error: countError } = await supabase
        .rpc('update_group_member_count', { group_id: id });
      
      if (countError) {
        logger.error('Error updating member count:', countError);
      }
      
      res.json({
        success: true,
        message: 'Member removed successfully'
      });
      
    } catch (error) {
      logger.error('Error in removeMember:', error);
      
      if (error instanceof AuthorizationError || error instanceof NotFoundError || error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to remove member'
        });
      }
    }
  }
  
  /**
   * Leave group
   */
  static async leaveGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      logger.info('User leaving group', { groupId: id, userId });
      
      // Check if user is a member
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (membershipError || !membership) {
        throw new NotFoundError('You are not a member of this group');
      }
      
      // Check if user is the group creator
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', id)
        .single();
      
      if (groupError || !group) {
        throw new NotFoundError('Group not found');
      }
      
      if (group.created_by === userId) {
        throw new ValidationError('Group creator cannot leave the group. Transfer ownership or delete the group instead.');
      }
      
      // Deactivate membership
      const { error: leaveError } = await supabase
        .from('group_members')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('group_id', id)
        .eq('user_id', userId);
      
      if (leaveError) {
        logger.error('Error leaving group:', leaveError);
        throw new Error('Failed to leave group');
      }
      
      // Update group member count
      const { error: countError } = await supabase
        .rpc('update_group_member_count', { group_id: id });
      
      if (countError) {
        logger.error('Error updating member count:', countError);
      }
      
      res.json({
        success: true,
        message: 'Left group successfully'
      });
      
    } catch (error) {
      logger.error('Error in leaveGroup:', error);
      
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to leave group'
        });
      }
    }
  }
}