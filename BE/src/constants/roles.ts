/**
 * User Roles Constants
 * Định nghĩa các vai trò người dùng trong hệ thống
 */

export enum UserRole {
  ADMIN = 'admin',           // Quản trị viên hệ thống - Full access
  MANAGER = 'manager',       // Quản lý - Quản lý sản phẩm, đơn hàng, người dùng
  STAFF = 'staff',           // Nhân viên xử lý đơn lỗi/đơn bị từ chối nhận
  CUSTOMER = 'customer',     // Khách hàng - Mua hàng, xem đơn hàng
  USER = 'user',            // Người dùng cơ bản - Quyền hạn chế
  SHIPPER = 'shipper',      // Người giao hàng - Xem và cập nhật đơn hàng
  FARMER = 'farmer'         // Nông dân - Quản lý sản phẩm nông sản của mình
}

/**
 * Permissions Constants
 * Định nghĩa các quyền cụ thể trong hệ thống
 */

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ALL = 'user:manage_all',

  // Product Management
  PRODUCT_CREATE = 'product:create',
  PRODUCT_READ = 'product:read',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_MANAGE_ALL = 'product:manage_all',

  // Category Management
  CATEGORY_CREATE = 'category:create',
  CATEGORY_READ = 'category:read',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',
  CATEGORY_MANAGE_ALL = 'category:manage_all',

  // Order Management
  ORDER_CREATE = 'order:create',
  ORDER_READ = 'order:read',
  ORDER_UPDATE = 'order:update',
  ORDER_DELETE = 'order:delete',
  ORDER_MANAGE_ALL = 'order:manage_all',

  // Shipping
  SHIPPING_VIEW = 'shipping:view',
  SHIPPING_UPDATE = 'shipping:update',
  SHIPPING_DELIVER = 'shipping:deliver',

  // Farmer Specific
  FARMER_PRODUCT_MANAGE = 'farmer:product_manage',
  FARMER_ORDER_VIEW = 'farmer:order_view',

  // Reports & Analytics
  REPORTS_VIEW = 'reports:view',
  ANALYTICS_VIEW = 'analytics:view',

  // System Settings
  SETTINGS_MANAGE = 'settings:manage',
}

/**
 * Role Permissions Mapping
 * Định nghĩa quyền cho từng vai trò
 */

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Full access to everything
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ALL,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_MANAGE_ALL,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
    Permission.CATEGORY_MANAGE_ALL,
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_DELETE,
    Permission.ORDER_MANAGE_ALL,
    Permission.SHIPPING_VIEW,
    Permission.SHIPPING_UPDATE,
    Permission.SHIPPING_DELIVER,
    Permission.REPORTS_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_MANAGE,
  ],

  [UserRole.MANAGER]: [
    // Can manage most things except system settings
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_MANAGE_ALL,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
    Permission.CATEGORY_MANAGE_ALL,
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
    Permission.ORDER_MANAGE_ALL,
    Permission.SHIPPING_VIEW,
    Permission.SHIPPING_UPDATE,
    Permission.REPORTS_VIEW,
    Permission.ANALYTICS_VIEW,
  ],

  [UserRole.STAFF]: [
    // Chỉ xử lý đơn hàng lỗi (đơn trả về)
    Permission.ORDER_READ,
    Permission.ORDER_UPDATE,
  ],

  [UserRole.CUSTOMER]: [
    // Can only manage their own orders
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.PRODUCT_READ,
    Permission.ORDER_CREATE,
    Permission.ORDER_READ,
  ],

  [UserRole.USER]: [
    // Basic user permissions
    Permission.USER_READ,
    Permission.PRODUCT_READ,
  ],

  [UserRole.SHIPPER]: [
    // Can view and update shipping status
    Permission.USER_READ,
    Permission.PRODUCT_READ,
    Permission.ORDER_READ,
    Permission.SHIPPING_VIEW,
    Permission.SHIPPING_UPDATE,
    Permission.SHIPPING_DELIVER,
  ],

  [UserRole.FARMER]: [
    // Can manage their own products and view related orders
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.PRODUCT_READ,
    Permission.FARMER_PRODUCT_MANAGE,
    Permission.FARMER_ORDER_VIEW,
  ],
};

/**
 * Role Hierarchy
 * Định nghĩa cấp bậc của các vai trò (số càng cao quyền càng lớn)
 */

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.MANAGER]: 80,
  [UserRole.STAFF]: 70,
  [UserRole.FARMER]: 60,
  [UserRole.SHIPPER]: 50,
  [UserRole.CUSTOMER]: 40,
  [UserRole.USER]: 20,
};

/**
 * Helper function to check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Helper function to check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Helper function to check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Helper function to check if roleA is higher than roleB in hierarchy
 */
export const isRoleHigherThan = (roleA: UserRole, roleB: UserRole): boolean => {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
};

/**
 * Helper function to get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};
