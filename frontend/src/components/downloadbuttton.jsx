
import { Spinner,Button  } from "@material-tailwind/react";

export const DownloadButtton = ({ onClick,isLoading }) => (
  <Button
    variant="contained"
    color="primary"
    onClick={onClick}
    disabled={isLoading}
  >
    {isLoading ? <Spinner size={24} /> : 'Download'}
  </Button>
);