import { NotFoundError } from '../core/errors';
import { RoleModel } from '../models/role.model';
import { Types } from 'mongoose';
import { IRoleInput, IGrantInput } from '../interfaces/role.interface';
import { getReturnData, getReturnList } from '@utils/index';

const getRoles = async (query: any = {}) => {
  try {
    const roles = await RoleModel.find(query)
      .populate('grants.resourceId')
      .sort({ createdAt: -1 });
    return getReturnList(roles);
  } catch (error) {
    throw error;
  }
};

const createRole = async (roleData: IRoleInput) => {
  try {
    // Tạo instance mới
    const newRole = new RoleModel({
      ...roleData,
      grants: roleData.grants || [],
    });
    // Lưu vào database
    const savedRole = await newRole.save();
    return getReturnData(savedRole);
  } catch (error) {
    throw error;
  }
};

const getRoleById = async (roleId: string) => {
  try {
    const role = await RoleModel.findById(roleId).populate('grants.resourceId');
    if (!role) throw new NotFoundError('Role not found');
    return getReturnData(role);
  } catch (error) {
    throw error;
  }
};

const updateRole = async (roleId: string, roleData: Partial<IRoleInput>) => {
  try {
    const role = await RoleModel.findByIdAndUpdate(roleId, roleData, {
      new: true,
    }).populate('grants.resourceId');
    if (!role) throw new NotFoundError('Role not found');
    return getReturnData(role);
  } catch (error) {
    throw error;
  }
};

const deleteRole = async (roleId: string) => {
  try {
    const role = await RoleModel.findByIdAndDelete(roleId);
    if (!role) throw new NotFoundError('Role not found');
    return getReturnData(role);
  } catch (error) {
    throw error;
  }
};

const updateRoleGrants = async (roleId: string, grants: IGrantInput[]) => {
  try {
    // Lấy role hiện tại
    const currentRole = await RoleModel.findById(roleId);
    if (!currentRole) throw new NotFoundError('Role not found');

    // Cập nhật các grants
    const updatedGrants = currentRole.grants.map((currentGrant) => {
      // Tìm grant mới tương ứng trong danh sách cập nhật
      const updateGrant = grants.find(
        (g) => g.resourceId.toString() === currentGrant.resourceId.toString()
      );

      if (updateGrant) {
        // Nếu tìm thấy grant cần update, cập nhật actions mới
        return {
          _id: currentGrant._id, // Giữ lại ID của grant hiện tại
          resourceId: currentGrant.resourceId,
          actions: updateGrant.actions,
        };
      }
      // Nếu không tìm thấy, chuyển đổi grant hiện tại thành plain object
      return {
        _id: currentGrant._id,
        resourceId: currentGrant.resourceId,
        actions: currentGrant.actions,
      };
    });

    // Cập nhật role với grants đã được xử lý
    const role = await RoleModel.findByIdAndUpdate(
      roleId,
      { grants: updatedGrants },
      { new: true }
    ).populate('grants.resourceId');

    if (!role) throw new NotFoundError('Role not found');
    return getReturnData(role);
  } catch (error) {
    throw error;
  }
};
const addRoleGrants = async (roleId: string, newGrants: IGrantInput[]) => {
  try {
    // Lấy role hiện tại
    const currentRole = await RoleModel.findById(roleId);
    if (!currentRole) throw new NotFoundError('Role not found');

    // Tạo map của các grant hiện tại theo resourceId để kiểm tra trùng lặp
    const existingResourceIds = new Set(
      currentRole.grants.map((grant) => grant.resourceId.toString())
    );

    // Lọc ra các grant mới (không trùng với grant hiện tại)
    const validNewGrants = newGrants.filter(
      (grant) => !existingResourceIds.has(grant.resourceId.toString())
    );

    // Chuyển đổi resourceId thành ObjectId
    const grantsToAdd = validNewGrants.map((grant) => ({
      resourceId: new Types.ObjectId(grant.resourceId),
      actions: grant.actions,
    }));

    // Thêm grants mới vào mảng grants hiện tại
    const updatedRole = await RoleModel.findByIdAndUpdate(
      roleId,
      {
        $push: {
          grants: {
            $each: grantsToAdd,
          },
        },
      },
      {
        new: true,
      }
    ).populate('grants.resourceId');

    if (!updatedRole) throw new NotFoundError('Role not found after update');
    return getReturnData(updatedRole);
  } catch (error) {
    throw error;
  }
};
const deleteRoleGrant = async (roleId: string, resourceId: string) => {
  try {
    // Kiểm tra role tồn tại
    const currentRole = await RoleModel.findById(roleId);
    if (!currentRole) throw new NotFoundError('Role not found');

    // Kiểm tra grant tồn tại
    const grantExists = currentRole.grants.some(
      (grant) => grant.resourceId.toString() === resourceId
    );
    if (!grantExists) throw new NotFoundError('Grant not found in this role');

    // Xóa grant khỏi role bằng cách pull resource đó ra khỏi mảng grants
    const updatedRole = await RoleModel.findByIdAndUpdate(
      roleId,
      {
        $pull: {
          grants: {
            resourceId: new Types.ObjectId(resourceId),
          },
        },
      },
      {
        new: true,
      }
    ).populate('grants.resourceId');

    if (!updatedRole) throw new NotFoundError('Role not found after update');
    return getReturnData(updatedRole);
  } catch (error) {
    throw error;
  }
};

export {
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  updateRoleGrants,
  addRoleGrants,
  deleteRoleGrant,
};
