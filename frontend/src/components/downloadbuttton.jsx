
import { Spinner } from "@material-tailwind/react";
import { Button } from "@mui/material";
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