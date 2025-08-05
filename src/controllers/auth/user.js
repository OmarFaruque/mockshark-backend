import { defaultLimit, defaultPage } from "../../utils/defaultData.js";
import jsonResponse from "../../utils/jsonResponse.js";
import prisma from "../../utils/prismaClient.js";
import upldusercloudnary from "../../utils/upldusercloudnary.js";
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
  // First handle the image upload outside the transaction
  let imageUrl = req.user?.image;

  if (req.file) {
    console.log("File received:", {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    try {
      // Validate file
      if (!req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Uploaded file is empty or corrupted",
        });
      }

      // Upload to Cloudinary
      // Upload to Cloudinary
      const result = await upldusercloudnary(req.file, "user_profiles");
      console.log("Cloudinary upload result URL:", result);

      if (!result) {
        return res.status(500).json({
          success: false,
          message: "Cloudinary upload failed - no URL returned",
        });
      }

      imageUrl = result; // <-- assign the URL string directly
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  // Now handle the database update in a transaction
  try {
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

    const updatedUser = await prisma.$transaction(
      async (tx) => {
        return await tx.user.update({
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
            image: imageUrl,
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
      },
      {
        maxWait: 10000, // 10 seconds max wait
        timeout: 10000, // 10 seconds timeout
      }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Database error:", error);

    // Handle Prisma transaction timeout specifically
    if (error.code === "P2028") {
      return res.status(500).json({
        success: false,
        message: "Database operation timed out",
        suggestion: "Please try again with a smaller file or contact support",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
