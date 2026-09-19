type Props = {
    message?: string;
};

export default function FieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;
}
