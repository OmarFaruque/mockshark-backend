import { defaultLimit, defaultPage } from "../../utils/defaultData.js";
import jsonResponse from "../../utils/jsonResponse.js";
import prisma from "../../utils/prismaClient.js";
import uploadToCLoudinary from "../../utils/uploadToCloudinary.js";
import validateInput from "../../utils/validateInput.js";

const module_name = "user";

//get all users
export const getUsers = async (req, res) => {
  if (req.user?.roleName !== "super-admin") {
    getUsersByUser(req, res);
  } else {
    try {
      const users = await prisma.user.findMany({
        where: {
          isDeleted: false,
          AND: [
            {
              name: {
                contains: req.query.name,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: req.query.email,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: req.query.phone,
                mode: "insensitive",
              },
            },
            {
              address: {
                contains: req.query.address,
                mode: "insensitive",
              },
            },
            {
              isActive: req.query.active
                ? req.query.active.toLowerCase() === "active"
                  ? true
                  : false
                : true,
            },
          ],
        },
        include: {
          role: { include: { roleModules: true } },
          products: true,
          campaigns: true,
          suppliers: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip:
          req.query.limit && req.query.page
            ? parseInt(req.query.limit * (req.query.page - 1))
            : parseInt(defaultLimit() * (defaultPage() - 1)),
        take: req.query.limit
          ? parseInt(req.query.limit)
          : parseInt(defaultLimit()),
      });

      if (users.length === 0)
        return res
          .status(200)
          .json(jsonResponse(true, "No user is available", null));

      if (users) {
        return res
          .status(200)
          .json(jsonResponse(true, `${users.length} users found`, users));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Something went wrong. Try again", null));
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(false, error, null));
    }
  }
};

//get all users by user
export const getUsersByUser = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        parentId: req.user?.id,
        isDeleted: false,
        AND: [
          {
            name: {
              contains: req.query.name,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: req.query.email,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: req.query.phone,
            },
          },
          {
            address: {
              contains: req.query.address,
              mode: "insensitive",
            },
          },
          {
            isActive: req.query.active
              ? req.query.active.toLowerCase() === "active"
                ? true
                : false
              : true,
          },
        ],
      },
      include: {
        role: { include: { roleModules: true } },
        products: true,
        campaigns: true,
        suppliers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip:
        req.query.limit && req.query.page
          ? parseInt(req.query.limit * (req.query.page - 1))
          : parseInt(defaultLimit() * (defaultPage() - 1)),
      take: req.query.limit
        ? parseInt(req.query.limit)
        : parseInt(defaultLimit()),
    });

    if (users.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No user is available", null));

    if (users) {
      return res
        .status(200)
        .json(jsonResponse(true, `${users.length} users found`, users));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "Something went wrong. Try again", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//get single user
export const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (user) {
      return res.status(200).json(jsonResponse(true, `1 user found`, user));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No user is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update user
export const updateUser = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const {
        roleId,
        name,
        fullname,
        email,
        about,
        phone,
        address,
        language,
        billingAddress,
        city,
        country,
        postalCode,
        initialPaymentAmount,
        initialPaymentDue,
        installmentTime,
        billingFirstName,     
        billingLastName,      
        billingCompany,       
        billingCountry,      
        billingEmail,         
        billingPhone,
        apartment,
        state,                              
      } = req.body;

     let imageUrl = req.user?.image;

if (req.file) {
  try {
    const result = await uploadToCLoudinary(req.file, "user_profiles");
    imageUrl = result.secure_url;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image to Cloudinary",
    });
  }
}

      const updatedUser = await tx.user.update({
        where: { id: req.params.id },
        data: {
          roleId,
          name,
          fullname,
          email,
          about,
          phone,
          address,
          language,
          billingAddress,
          city,
          country,
          postalCode,
          image: imageUrl, // this is the cloudinary url
          initialPaymentAmount,
          initialPaymentDue,
          installmentTime,
          billingFirstName,     
          billingLastName,      
          billingCompany,       
          billingCountry,      
          billingEmail,         
          billingPhone,
          apartment,
          state,   
          updatedBy: req.user?.id,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Profile has been updated.",
        user: updatedUser,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//ban user
export const banUser = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      //ban user
      const getUser = await tx.user.findFirst({
        where: { id: req.params.id },
      });

      const user = await tx.user.update({
        where: { id: req.params.id },
        data: {
          isActive: getUser.isActive === true ? false : true,
        },
      });

      if (user) {
        return res
          .status(200)
          .json(jsonResponse(true, `User has been banned`, user));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "User has not been banned", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//delete user
export const deleteUser = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.params.id },
        data: { deletedBy: req.user.id, isDeleted: true },
      });

      if (user) {
        return res
          .status(200)
          .json(jsonResponse(true, `User has been deleted`, user));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "User has not been deleted", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};
