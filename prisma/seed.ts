import {
  advertisementPlaceHolder,
  advertiseRedirectLink,
  videoPlaceHolder,
  vimeoPlaceHolder,
} from "../src/constants/data";
import prisma from "../src/prisma";
import { uploadImage } from "../src/utility/aws/uploadFile";

async function main() {
  const [dashboardUser, vidImage, advImage] = await Promise.all([
    prisma.dashboardUser.createMany({
      data: [
        {
          emailId: "utekar.parag@steigenhealthcare.com",
          fullName: "Parag Utekar",
          position: "CEO, Steigen Healthcare",
          role: "SUPERADMIN",
        },
        {
          emailId: "mef@ciklum.com",
          fullName: "Megan Fernandes",
          position: "Node.js developer",
          role: "SUPERADMIN",
        },
        {
          emailId: "avai@ciklum.com",
          fullName: "Arya Vaigankar",
          position: "Admin Portal Frontend developer",
          role: "SUPERADMIN",
        },
        {
          emailId: "mamuk@ciklum.com",
          fullName: "Marufa Mukadam",
          position: "Node.js developer",
          role: "SUPERADMIN",
        },
      ],
    }),

    uploadImage({
      image: videoPlaceHolder,
      folder: "placeHolders",
      name: "videoPlaceHolder",
    }),
    uploadImage({
      image: advertisementPlaceHolder,
      folder: "placeHolders",
      name: "AdvertisePlaceHolder",
    }),
  ]);

  const [facs, vitalModules, videos, advertisements] = await Promise.all([
    prisma.facility.createMany({
      data: [
        {
          facPrimaryName: "Dr. Sanika Wagle",
          //   "facSecondaryName": "",
          facPhoneNumber: "9995557778",
          facAddress: "Chellaram Hosptial, bavdhan, Pune",
          facPincode: "411021",
          facSpeciality: ["general", "gynacelogy"],
          facType: "doctor",
          isActive: true,
          updatedBy: "mef@ciklum.com",
        },
        {
          facPrimaryName: "Chellaram Hosptial",
          facSecondaryName: "mutlispeciality",
          facPhoneNumber: "9898989800",
          facAddress:
            "Chellaram Hosptial,near numbai-pune highway, bavdhan, Pune",
          facPincode: "411021",
          facSpeciality: ["general"],
          facType: "hospital/clinic",
          isActive: true,
          updatedBy: "mef@ciklum.com",
        },
        {
          facPrimaryName: "SRL Diagnostics",
          facSecondaryName: "pathology Lab",
          facPhoneNumber: "9876789098",
          facAddress: "18 June Road, near don boscos, Panaji, Goa",
          facPincode: "403001",
          facSpeciality: ["pathology"],
          facType: "hospital/clinic",
          isActive: true,
          updatedBy: "mef@ciklum.com",
        },
        {
          facPrimaryName: "Dr. Mihir Naik",
          //   "facSecondaryName": "",
          facPhoneNumber: "8412341634",
          facAddress: "Chellaram Hosptial, bavdhan, Pune",
          facPincode: "411021",
          facSpeciality: ["neurology"],
          facType: "doctor",
          isActive: true,
          updatedBy: "mef@ciklum.com",
        },
      ],
    }),
    prisma.vitalModule.createMany({
      data: [
        {
          vitalName: "BMI",
          vitalCode: "bmi02",
          updatedBy: "mef@ciklum.com",
          vitalDataStructure: [
            {
              metric: "height",
              dataType: "float",
              units: ["cm", "m", "in"],
            },
            {
              metric: "weight",
              dataType: "float",
              units: ["kg", "lbs", "ounce"],
            },
          ],
          filters: [],
        },
        {
          vitalName: "period diary",
          vitalCode: "period01",
          updatedBy: "mef@ciklum.com",
          vitalDataStructure: [
            {
              metric: "startDate",
              dataType: "DateTime",
              units: [],
            },
            {
              metric: "cycle",
              dataType: "Integer",
              units: [],
            },
            {
              metric: "isPCOD",
              dataType: "boolean",
              units: [],
            },
          ],
          filters: [
            {
              key: "gender",
              value: "female",
            },
          ],
        },
        {
          vitalName: "blood pressure",
          vitalCode: "bp03",
          updatedBy: "mef@ciklum.com",
          vitalDataStructure: [
            {
              metric: "systole",
              dataType: "float",
              units: [],
            },
            {
              metric: "diastole",
              dataType: "float",
              units: [],
            },
          ],
          filters: [
            {
              key: "age",
              value: "20",
            },
          ],
        },
        {
          vitalName: "blood glucose",
          vitalCode: "bg04",
          updatedBy: "mef@ciklum.com",
          vitalDataStructure: [
            {
              metric: "glucose level",
              dataType: "float",
              units: [],
            },
          ],
          filters: [],
        },
        {
          vitalName: "Waist-Hip Ratio",
          vitalCode: "whr05",
          updatedBy: "mef@ciklum.com",
          vitalDataStructure: [
            {
              metric: "waist",
              dataType: "float",
              units: ["cm", "m", "in"],
            },
            {
              metric: "hip",
              dataType: "float",
              units: ["cm", "m", "in"],
            },
          ],
          filters: [],
        },
      ],
    }),
    vidImage &&
      prisma.video.createMany({
        data: [
          {
            vidSourceUrl: vimeoPlaceHolder,
            isActive: true,
            isSubscribed: false,
            priority: 3,
            updatedBy: "mef@ciklum.com",
            vidThumbnail: vidImage?.Location,
            vidName: "Yoga for your baby and you",
            vidTags: ["pregnancy", " baby", " yoga"],
          },
          {
            vidSourceUrl: vimeoPlaceHolder,
            isActive: true,
            isSubscribed: false,
            priority: 1,
            updatedBy: "mef@ciklum.com",
            vidThumbnail: vidImage?.Location,
            vidName: "Lets Beat diabetes",
            vidTags: ["diet", " food", " healthy"],
          },
          {
            vidSourceUrl: vimeoPlaceHolder,
            isActive: true,
            isSubscribed: false,
            priority: 0,
            updatedBy: "mef@ciklum.com",
            vidThumbnail: vidImage?.Location,
            vidName: "Busting Myths",
            vidTags: ["health", "general"],
          },
          {
            vidSourceUrl: vimeoPlaceHolder,
            isActive: true,
            isSubscribed: false,
            priority: 0,
            updatedBy: "mef@ciklum.com",
            vidThumbnail: vidImage?.Location,
            vidName: "Yoga Benefits",
            vidTags: ["yoga", "fitness"],
          },
        ],
      }),
    advImage &&
      prisma.advertisement.createMany({
        data: [
          {
            isActive: true,
            advName: "Chellaram",
            advRedirectLink: advertiseRedirectLink,
            advSourceUrl: advImage?.Location,
            isSubscribed: false,
            priority: 1,
            updatedBy: "mef@ciklum.com",
            advPosition: "top",
            advType: "promotion",
          },
          {
            isActive: true,
            advName: "Oppo Reno 5s",
            advRedirectLink: advertiseRedirectLink,
            advSourceUrl: advImage?.Location,
            isSubscribed: false,
            priority: 3,
            updatedBy: "mef@ciklum.com",
            advPosition: "top",
            advType: "promotion",
          },
          {
            isActive: true,
            advName: "New Self Awareweness",
            advRedirectLink: "",
            advSourceUrl: advImage?.Location,
            isSubscribed: false,
            priority: 1,
            updatedBy: "mef@ciklum.com",
            advPosition: "bottom",
            advType: "feature",
          },
          {
            isActive: true,
            advName: "Family Linking",
            advRedirectLink: advertiseRedirectLink,
            advSourceUrl: advImage?.Location,
            isSubscribed: false,
            priority: 0,
            updatedBy: "mef@ciklum.com",
            advPosition: "bottom",
            advType: "feature",
          },
          {
            isActive: true,
            advName: "Chellaram",
            advRedirectLink: advertiseRedirectLink,
            advSourceUrl: advImage?.Location,
            isSubscribed: false,
            priority: 2,
            updatedBy: "mef@ciklum.com",
            advPosition: "top",
            advType: "promotion",
          },
        ],
      }),
  ]);
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
