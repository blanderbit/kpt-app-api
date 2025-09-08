import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleService {
  /**
   * Parse roles string to array
   * @param roles Roles string (e.g., "user,admin")
   * @returns Array of roles
   */
  parseRoles(roles: string): string[] {
    if (!roles) return ['user'];
    return roles.split(',').map(role => role.trim()).filter(role => role.length > 0);
  }

  /**
   * Convert roles array to string
   * @param roles Array of roles
   * @returns Roles string
   */
  stringifyRoles(roles: string[]): string {
    if (!Array.isArray(roles) || roles.length === 0) return 'user';
    return roles.join(',');
  }

  /**
   * Check if user has specific role
   * @param userRoles User roles string
   * @param requiredRole Required role
   * @returns true if user has required role
   */
  hasRole(userRoles: string, requiredRole: string): boolean {
    const roles = this.parseRoles(userRoles);
    return roles.includes(requiredRole);
  }

  /**
   * Check if user has any of the required roles
   * @param userRoles User roles string
   * @param requiredRoles Array of required roles
   * @returns true if user has any of required roles
   */
  hasAnyRole(userRoles: string, requiredRoles: string[]): boolean {
    const roles = this.parseRoles(userRoles);
    return requiredRoles.some(role => roles.includes(role));
  }

  /**
   * Add role to user
   * @param userRoles Current user roles string
   * @param newRole New role to add
   * @returns Updated roles string
   */
  addRole(userRoles: string, newRole: string): string {
    const roles = this.parseRoles(userRoles);
    if (!roles.includes(newRole)) {
      roles.push(newRole);
    }
    return this.stringifyRoles(roles);
  }

  /**
   * Remove role from user
   * @param userRoles Current user roles string
   * @param roleToRemove Role to remove
   * @returns Updated roles string
   */
  removeRole(userRoles: string, roleToRemove: string): string {
    const roles = this.parseRoles(userRoles);
    const filteredRoles = roles.filter(role => role !== roleToRemove);
    return this.stringifyRoles(filteredRoles);
  }

  /**
   * Get default roles for new user
   * @returns Default roles string
   */
  getDefaultRoles(): string {
    return 'user';
  }
}
