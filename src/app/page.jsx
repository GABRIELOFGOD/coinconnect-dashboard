import DashBoardLayerFive from "@/components/DashBoardLayerFive";
import DashBoardLayerOne from "@/components/DashBoardLayerOne";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Breadcrumb } from "react-bootstrap";

export const metadata = {
  title: "WowDash NEXT JS - Admin Dashboard Multipurpose Bootstrap 5 Template",
  description:
    "Wowdash NEXT JS is a developer-friendly, ready-to-use admin template designed for building attractive, scalable, and high-performing web applications.",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Investments' />

        <DashBoardLayerFive /> {/* DashBoardLayerOne was here before, I commented it out below and replaced it with DashboadLayerFive */}
        {/* DashBoardLayerOne */}
        {/* <DashBoardLayerOne /> */}
      </MasterLayout>
    </>
  );
};

export default Page;
