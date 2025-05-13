import UnitCountFour from "./child/UnitCountFour";
import RevenueStatisticsOne from "./child/RevenueStatisticsOne";
import SalesStatisticTwo from "./child/SalesStatisticTwo";
import TopCountriesTwo from "./child/TopCountriesTwo";
import UserActivatesTwo from "./child/UserActivatesTwo";
import LatestInvestmentsOne from "./child/LatestInvestmentsOne";
import NoticeBoardOne from "./child/NoticeBoardOne";
import TotalTransactionsOne from "./child/TotalTransactionsOne";
import ProjectStatusOne from "./child/ProjectStatusOne";

const DashBoardLayerFive = () => {
  return (
    <>
      <div className='row gy-4'>
        {/* UnitCountFour */}
        <UnitCountFour /> {/* I worked in here */}

        {/* RevenueStatisticsOne */}
        <RevenueStatisticsOne />

        {/* TopCountriesTwo */}
        {/* <TopCountriesTwo /> */}

        {/* UserActivatesTwo */}
        {/* <UserActivatesTwo /> */}

        {/* SalesStatisticTwo */}
        <SalesStatisticTwo />

        {/* LatestInvestmentsOne */}
        <LatestInvestmentsOne />

        {/* NoticeBoardOne */}
        {/* <NoticeBoardOne /> */}

        {/* TotalTransactionsOne */}
        <TotalTransactionsOne />

        {/* ProjectStatusOne */}
        <ProjectStatusOne />
      </div>
    </>
  );
};

export default DashBoardLayerFive;
